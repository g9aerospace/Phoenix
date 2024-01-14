// site/serve.js

const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.SITE_PORT || 3000;
const IP = process.env.SITE_IP || '0.0.0.0';
const siteWebhookURL = process.env.SITE_WEBHOOK_URL;

const logsFolder = './logs';

// Function to get the newest log file in the logs folder
function getNewestLogFile() {
  const logFiles = fs.readdirSync(logsFolder);
  const newestLogFile = logFiles.reduce((prev, current) => {
    const prevTimestamp = Date.parse(prev.split('_')[0]);
    const currentTimestamp = Date.parse(current.split('_')[0]);
    return currentTimestamp > prevTimestamp ? current : prev;
  }, logFiles[0]);
  return path.join(logsFolder, newestLogFile);
}

// Function to log messages to the console, newest log file, and webhook queue
async function log(message) {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const formattedMessage = `[${timestamp}] ${message}`;

  console.log(formattedMessage);

  // Log to the newest log file in the logs folder
  const currentLogFile = getNewestLogFile();
  fs.appendFileSync(currentLogFile, `${formattedMessage}\n`);

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
  log(`Server is running at https://${IP}:${PORT}`);
});
