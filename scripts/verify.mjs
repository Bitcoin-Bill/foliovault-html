import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const bytes=readFileSync(new URL('../dist/foliovault.html',import.meta.url));
assert(bytes.equals(readFileSync(new URL('../src/foliovault.html',import.meta.url))));
assert.equal(readFileSync(new URL('../dist/SHA256SUMS.txt',import.meta.url),'utf8'),createHash('sha256').update(bytes).digest('hex')+'  foliovault.html\n');
console.log('Verified artifact/source equality and checksum');
