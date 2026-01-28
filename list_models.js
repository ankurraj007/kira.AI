
import fs from 'fs';
import https from 'https';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
    if (match) {
        apiKey = match[1].trim();
    }
} catch (e) {
    console.error("Error reading .env:", e.message);
}

if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                fs.writeFileSync('models.json', JSON.stringify(json.error, null, 2));
            } else {
                fs.writeFileSync('models.json', JSON.stringify(json.models.filter(m => m.name.includes('flash')), null, 2));
            }
        } catch (e) {
            fs.writeFileSync('models.json', `Error: ${e.message}\n${data}`);
        }
    });
}).on('error', err => {
    fs.writeFileSync('models.json', `Error: ${err.message}`);
});
