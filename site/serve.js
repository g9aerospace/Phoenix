const express = require('express');
const path = require('path');

const app = express();
const port = 5590;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${port}`);
});
