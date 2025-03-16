const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve JSON files with proper content type
app.get('*.json', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.sendFile(path.join(__dirname, req.path));
});

// For single page application - redirect all routes to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 