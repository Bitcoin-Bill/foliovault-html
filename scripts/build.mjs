import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const bytes=readFileSync(new URL('../src/foliovault.html',import.meta.url));
mkdirSync(new URL('../dist/',import.meta.url),{recursive:true});
writeFileSync(new URL('../dist/foliovault.html',import.meta.url),bytes);
writeFileSync(new URL('../dist/SHA256SUMS.txt',import.meta.url),createHash('sha256').update(bytes).digest('hex')+'  foliovault.html\n');
console.log('Built dist/foliovault.html');
