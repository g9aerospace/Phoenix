const path = require('path');
const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');

const logQueue = [];
let isLogging = false;
const MAX_RETRIES = 3; // Maximum number of retry attempts for rate limiting

const log = async (level, data) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${level}] - ${data}\n`;

  // Log to the console
  console.log(
    `${timestamp} [${chalk.green(level)}] - ${chalk.white(data)}`
  );

  // Write to a log file
  const logFilePath = `logs/log_${timestamp.slice(0, 10)}.txt`;
  fs.appendFileSync(logFilePath, logMessage);

  // Determine the filename of the calling file
  const callingFile = getCallingFileName();
  // Add log message to the queue with the filename
  logQueue.push({ level, data, filename: callingFile, timestamp });

  // If not currently logging, start processing the queue
  if (!isLogging) {
    processQueue();
  }
};

const getCallingFileName = () => {
  if (module.parent && module.parent.filename) {
    return path.basename(module.parent.filename);
  }
  return 'Unknown file';
};

const processQueue = async () => {
  if (logQueue.length === 0) {
    isLogging = false;
    return;
  }

  isLogging = true;
  const logData = logQueue.shift();

  try {
    // Send log message to the specified webhook with an embed
    await sendToWebhook(logData);
  } catch (error) {
    console.error(`⚠️Failed to log to webhook: ${error.message}`);
  }

  // Continue processing the queue
  processQueue();
};

const sendToWebhook = async ({ level, data, filename, timestamp }, retryCount = 0) => {
  const color = getColorForLevel(level);

  try {
    // Send the log message as an embed to the specified webhook URL
    const response = await axios.post(process.env.WEBHOOK_URL, {
      embeds: [{
        title: level,
        description: data,
        color: color,
        footer: {
          text: `${filename} ${getEmojiForStatus('success')}`, // Include emoji here
        },
        timestamp: timestamp,
      }],
    });

    if (response.status === 204) {
      console.log(`Webhook message sent successfully ${getEmojiForStatus('success')}`);
    } else {
      console.log(`Webhook message sent with status: ${response.status} - ${response.statusText} ${getEmojiForStatus('warning')}`);
    }
  } catch (error) {
    if (error.response && error.response.status === 429 && retryCount < MAX_RETRIES) {
      // Rate limited, implement exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Rate limited. Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      await sendToWebhook({ level, data, filename, timestamp }, retryCount + 1);
    } else {
      console.error(`⚠️Failed to log to webhook: ${error.message} ${getEmojiForStatus('error')}`);
      // Throw an error to indicate that logging to the webhook failed
      throw new Error('Failed to send log to webhook');
    }
  }
};

const getColorForLevel = (level) => {
  switch (level.toLowerCase()) {
    case 'info':
      return 0x3498db; // Blue
    case 'warn':
      return 0xf39c12; // Yellow
    case 'error':
      return 0xe74c3c; // Red
    default:
      return 0x2ecc71; // Green (default for undefined level)
  }
};

const getEmojiForStatus = (status) => {
  switch (status.toLowerCase()) {
    case 'success':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    default:
      return '';
  }
};

module.exports = { log };
