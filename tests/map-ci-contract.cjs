const fs=require('node:fs'),assert=require('node:assert/strict');
const workflow=fs.readFileSync('.github/workflows/check.yml','utf8');
for(const token of ['integration:','fetch-depth: 0','npm ci --ignore-scripts','npm run test:integration','actions/upload-artifact@v4'])assert.ok(workflow.includes(token),'F-05 CI missing '+token);
const pkg=JSON.parse(fs.readFileSync('package.json'));assert.ok(pkg.scripts['test:integration']);
const runner=fs.readFileSync('scripts/test-map-integration.mjs','utf8');
for(const name of ['map-build-inputs.mjs','map-navigation-browser.cjs','map-security-browser.cjs','map-session-browser.cjs','verify-map.mjs'])assert.ok(runner.includes(name),'F-05 integration runner missing '+name);
for(const name of ['map-security.cjs','map-ci-contract.cjs'])assert.ok(pkg.scripts.test.includes(name),'F-05 npm test missing '+name);
console.log('PASS integrated CI contract');
