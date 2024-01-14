// site/serve.js

const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.SITE_PORT || 5590;
const IP = process.env.SITE_IP || '0.0.0.0';
const siteWebhookURL = process.env.SITE_WEBHOOK_URL;

const logsFolder = './logs';

// Ensure logs folder exists
try {
  if (!fs.existsSync(logsFolder)) {
    fs.mkdirSync(logsFolder);
    console.log(`Logs folder '${logsFolder}' created.`);
  }
} catch (folderError) {
  console.error(`Error creating logs folder: ${folderError.message}`);
}

// Function to get the newest log file in the logs folder
function getNewestLogFile() {
  try {
    const logFiles = fs.readdirSync(logsFolder);
    if (logFiles.length === 0) {
      console.warn(`No log files found in '${logsFolder}'.`);
      return null;
    }

    const newestLogFile = logFiles.reduce((prev, current) => {
      const prevTimestamp = Date.parse(prev.split('_')[0]);
      const currentTimestamp = Date.parse(current.split('_')[0]);
      return currentTimestamp > prevTimestamp ? current : prev;
    }, logFiles[0]);

    return path.join(logsFolder, newestLogFile);
  } catch (error) {
    console.error(`Error reading log files: ${error.message}`);
    return null;
  }
}

// Function to log messages to the console, newest log file, and webhook queue
async function log(message) {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const formattedMessage = `[${timestamp}] ${message}`;

  console.log(formattedMessage);

  // Log to the newest log file in the logs folder
  const currentLogFile = getNewestLogFile();
  if (currentLogFile) {
    try {
      fs.appendFileSync(currentLogFile, `${formattedMessage}\n`);
      console.log(`Logged to file '${currentLogFile}' successfully.`);
    } catch (fileError) {
      console.error(`Error writing to log file: ${fileError.message}`);
    }
  }

  // Log to site webhook queue
  if (siteWebhookURL) {
    try {
      await axios.post(siteWebhookURL, { content: formattedMessage });
      console.log('Logged to site webhook successfully.');
    } catch (webhookError) {
      console.error(`Error logging to site webhook: ${webhookError.message}`);
    }
  }
}

// Serve static files from the 'public' folder
app.use(express.static('site/public'));

// Serve static files from the 'assets' folder
app.use('/assets', express.static('site/assets'));

// Start the server
app.listen(PORT, IP, () => {
  log(`Server is running at http://${IP}:${PORT}`);
});

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions globally
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle process exit
process.on('exit', (code) => {
  console.log(`Process exited with code ${code}`);
});
