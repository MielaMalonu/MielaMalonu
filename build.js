const fs = require('fs');
const path = require('path');

const SUPAURL = process.env.SUPAURL;
const KEY = process.env.KEY;

// Read your JS file
const jsFilePath = path.join(__dirname, 'public', 'js', 'app.js');  // Adjust to your file location
let jsFileContent = fs.readFileSync(jsFilePath, 'utf8');

// Replace the placeholders with the actual environment variables
jsFileContent = jsFileContent.replace('SUPAURL_PLACEHOLDER', SUPAURL)
                             .replace('KEY_PLACEHOLDER', KEY);

// Write the updated content back to the file
fs.writeFileSync(jsFilePath, jsFileContent);

console.log('Replaced environment variables in app.js');
