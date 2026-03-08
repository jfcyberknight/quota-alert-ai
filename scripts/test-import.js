import { pathToFileURL } from 'url';
import { join } from 'path';

const funcName = 'status';
const funcPath = join(process.cwd(), 'api', `${funcName}.js`);
console.log('funcPath:', funcPath);
console.log('URL:', pathToFileURL(funcPath).href);

async function test() {
  try {
    const mod = await import(pathToFileURL(funcPath).href + '?t=' + Date.now());
    console.log('Successfully imported status.js');
    console.log('Default export type:', typeof mod.default);
  } catch (e) {
    console.error('Import failed:', e.message);
  }
}

test();
