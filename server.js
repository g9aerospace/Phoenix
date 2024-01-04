// server.js
const express = require('express');
const path = require('path');
const { config } = require('dotenv');

config(); // Load environment variables from .env file

const app = express();
const port = process.env.WEB_SERVER_PORT || 3000;
const serverIP = process.env.SERVER_IP || 'localhost';

app.use(express.static(path.join(__dirname, 'sites')));

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${port}`);
  });
  