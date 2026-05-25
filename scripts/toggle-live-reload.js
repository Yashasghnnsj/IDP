import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../capacitor.config.ts');

const args = process.argv.slice(2);
const enable = args.includes('--enable');
const disable = args.includes('--disable');

let ip = '192.168.0.108'; // Default detected IP
const ipArgIndex = args.indexOf('--ip');
if (ipArgIndex !== -1 && args[ipArgIndex + 1]) {
  ip = args[ipArgIndex + 1];
}

if (!enable && !disable) {
  console.log('Usage: node scripts/toggle-live-reload.js --enable [--ip <pc-ip>] OR node scripts/toggle-live-reload.js --disable');
  process.exit(1);
}

let content = fs.readFileSync(configPath, 'utf8');

const serverRegex = /server:\s*\{([^}]+)\}/;

if (enable) {
  console.log(`\x1b[36m[Live Reload] Enabling Live Reload pointing to http://${ip}:5173...\x1b[0m`);
  
  const urlSnippet = `\n    url: 'http://${ip}:5173',\n    cleartext: true,\n    androidScheme: 'https',\n  `;
  
  if (serverRegex.test(content)) {
    content = content.replace(serverRegex, `server: {${urlSnippet}}`);
  } else {
    const lastBracketIndex = content.lastIndexOf('};');
    content = content.slice(0, lastBracketIndex) + `  server: {${urlSnippet}},\n` + content.slice(lastBracketIndex);
  }
} else if (disable) {
  console.log('\x1b[33m[Live Reload] Disabling Live Reload (switching back to Standalone Production mode)...\x1b[0m');
  
  const cleanServerSnippet = `\n    androidScheme: 'https',\n    cleartext: true,\n  `;
  content = content.replace(serverRegex, `server: {${cleanServerSnippet}}`);
}

fs.writeFileSync(configPath, content, 'utf8');
console.log('\x1b[32m[Live Reload] capacitor.config.ts updated successfully!\x1b[0m');
