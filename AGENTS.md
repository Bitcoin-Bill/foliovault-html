# Map — EntropyLab add-on

This repository contains the HTML edition only; do not add or modify the desktop Linux app.
Read docs/COLLABORATOR-FOLLOWUP.md and docs/MAP-INTEGRATION.md before follow-up work.
Map source lives in map/*.js; scripts/build-map.mjs packages it against the pinned host.
src/foliovault.html and integration/folio-panel.js are the earlier standalone/iframe prototype.
dist/ is generated; do not hand-edit generated HTML or overwrite frozen review bundles.

Do not edit existing EntropyLab source, cryptographic engine, Journal schema, or tool logic.
Use the host's unchanged notebook encryption functions for Map. Do not invent nonce,
salt, KDF, or export-kind changes. Legacy VAULTFOLIO/1 import compatibility stays green;
its original AES-GCM export implementation in the standalone prototype requires fresh
random salts/nonces. Desktop v2/hardware unlock remains unsupported.
No guide/credential browser storage, network APIs, telemetry or plaintext Map export.
HTML network/Bluetooth signals are warnings, not Linux-style environment gates.
Keep guide-only scope: no wallet seeds/private keys/xpubs or signing.
Preserve host session protections, licenses, source provenance and hidden-Journal policy.
Never claim guaranteed browser-memory erasure or security certification.

Use invented fixtures. Run npm run build, npm test, npm run verify. For plugin changes,
also run npm run build:map -- /path/to/pinned/entropylab using Node 24+ and verify the
builder's upstream-source comparisons. Test affected browser behavior and report exact
versions, artifact SHA-256, commands, results and untested limits. QA-only Journal builds
must remain separate from distributable builds; no debug hooks in shipping artifacts.

Changes go through reviewable PRs. No force-push, rebasing, deletion or automatic merging.
Do not publish upstream EntropyLab changes or deploy a website as part of this work.
