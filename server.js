const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle JSON files with the correct content type
app.get('*.json', (req, res) => {
    res.set('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, req.path));
});

// Redirect all other routes to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
}); 