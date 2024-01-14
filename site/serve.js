// Import necessary modules
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// Set the port from the environment variable or default to 3000
const port = process.env.SITE_PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Set the view engine to use in 'views' folder
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // Assuming you are using EJS as your template engine

// Define routes
app.get('/', (req, res) => {
    res.render('index'); // Change 'index' to your actual template file
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Display project structure map
console.log(`
Project Structure:

- site
  - public
    - css
    - js
    - images
  - views
  - serve.js
  - .env
`);
