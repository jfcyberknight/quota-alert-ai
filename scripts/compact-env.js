import fs from 'fs';
import path from 'path';

const envFile = path.join(process.cwd(), '.env.local');
const content = fs.readFileSync(envFile, 'utf8');

// Regex to find FIREBASE_SERVICE_ACCOUNT='{...}' or similar
// This is tricky for multi-line. Let's do it carefully.
const lines = content.split('\n');
let newLines = [];
let capture = false;
let jsonLines = [];
let keyFound = false;

for (let line of lines) {
  if (line.startsWith('FIREBASE_SERVICE_ACCOUNT=')) {
    keyFound = true;
    capture = true;
    const startValue = line.substring('FIREBASE_SERVICE_ACCOUNT='.length).trim();
    if (startValue.startsWith("'")) {
       const rest = startValue.substring(1);
       if (rest.endsWith("'")) {
         // Single line already?
         newLines.push(line);
         capture = false;
       } else {
         jsonLines.push(rest);
       }
    } else {
       // No quotes?
       jsonLines.push(startValue);
       if (startValue.endsWith('}')) capture = false;
    }
    continue;
  }
  
  if (capture) {
    const trimmed = line.trim();
    if (trimmed.endsWith("'")) {
      jsonLines.push(trimmed.substring(0, trimmed.length - 1));
      capture = false;
    } else {
      jsonLines.push(line);
    }
  } else {
    newLines.push(line);
  }
}

if (jsonLines.length > 0) {
  const fullJson = jsonLines.join('\n').trim();
  try {
    const parsed = JSON.parse(fullJson);
    const compact = JSON.stringify(parsed);
    newLines.push(`FIREBASE_SERVICE_ACCOUNT='${compact}'`);
    fs.writeFileSync(envFile, newLines.join('\n'));
    console.log('Successfully compacted FIREBASE_SERVICE_ACCOUNT in .env.local');
  } catch (e) {
    console.error('Failed to parse JSON for compacting:', e.message);
    console.error('Raw JSON attempt:', fullJson);
  }
} else if (!keyFound) {
  console.log('FIREBASE_SERVICE_ACCOUNT not found.');
}
