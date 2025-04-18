// build.js
const fs = require('fs');

// Read the HTML file
let html = fs.readFileSync('index.html', 'utf8');

// Replace placeholders with environment variables
html = html.replace('REPLACE_SUPAURL', process.env.SUPAURL || '');
html = html.replace('REPLACE_KEY', process.env.KEY || '');

// Write the processed HTML
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
