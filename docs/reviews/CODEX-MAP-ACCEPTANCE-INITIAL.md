# Codex Map acceptance report

**Result: CONDITIONAL PASS — artifact integrity and snapshot inspection pass; Mac browser acceptance is incomplete.** This report reviews the fixed ZIP snapshot only. No source or artifact was changed.

## Artifact identity

- Review ZIP: `map-entropylab-review.zip`
- ZIP SHA-256: `3416ae3ef33f1d29b41e1e923d890073cf6fa5155b7c815d94672eff6783406b`
- The ZIP `SHA256SUMS.txt` validates every listed file (`shasum -a 256 -c`: all OK).
- Bundled `entropylab-map.html` SHA-256: `874b473e329c0adfe99ed35446b34b3af8dc1ffc5b4fac230e012381cb49e7d5`
- `/Users/kimik3/Downloads/entropylab-map.html` has the same SHA-256 as the bundled HTML.
- OS reported by this Mac: macOS 12.7.6 (21H1320). Installed browser versions: Chrome 150.0.7871.125, Safari 17.6, Firefox 157.0.1.
- The bundle’s supplied `validation/chromium-ui.log` reports Chromium 153 and a successful targeted file URL GUI flow. That is prior snapshot evidence, not a run performed for this report; it is not the installed Chrome version above.

## Acceptance checks

| Check | Result | Evidence / limit |
|---|---|---|
| ZIP checksum and fixed HTML identity | PASS | All entries in `SHA256SUMS.txt` validated; downloaded HTML hash matches bundle. |
| Startup disclaimers, Map tab, native host integration | CONDITIONAL PASS | Supplied Chromium log records the disclaimer and Map selection flow. Source uses the host workspace and no iframe. Not reproduced in the installed Mac browsers. |
| Light/dark appearance and narrow layout | CONDITIONAL PASS | Bundle includes light, dark, and 390 px mobile screenshots; supplied log says those flows passed. Not freshly inspected interactively here. |
| Arrow/Home/End keyboard navigation | NOT VERIFIED | Handoff explicitly leaves full keyboard regression open. Code has custom boundary handlers; this does not establish screen-reader behavior or complete host tab parity. |
| Create/edit/repeaters/presets and ordinary host tools | NOT VERIFIED | No live interaction performed. The supplied QA log covers basic guide creation and tab switching, not every section/repeater/preset or each ordinary tool. |
| Encrypted download, reopen, editor, Heir View, notes/checks persistence | CONDITIONAL PASS | Supplied Chromium log reports encrypted download/reopen, Heir View notes/checklist, re-encryption, and restoration via Journal. No independent rerun. |
| Wrong password, corrupt/ordinary notebook, desktop v2, legacy v1, boundaries | CONDITIONAL PASS | Snapshot’s documented test command and test source cover wrong password, tamper, non-Map notebook, size limit, and v1 import. Test execution was not possible here because Node.js is unavailable. Desktop v2 rejection is visible in the open flow source but was not exercised. |
| Concealment, pagehide/bfcache, End session, async interruption and stale download behavior | NOT VERIFIED | Source has epoch checks, blur/visibility/idle integration, and pagehide cleanup. Race behavior was not exercised; the snapshot lists teardown races as open. No secure RAM erasure is claimed. |
| Journal-enabled workflow | CONDITIONAL PASS | Supplied Chromium log reports the Map → existing Journal upload → Map restoration flow. The bundle says QA used upstream’s own Journal-enabled test build. Pinned public artifact keeps Journal hidden; this review did not enable it. |
| Network/browser storage/privacy observation | PARTIAL | Snapshot says initial Chromium create/download/tab-switch flow observed no HTTP(S) requests. No fresh network or storage audit was performed. This does not address browser/OS copies. |
| Clean pinned rebuild and source preservation | NOT VERIFIED HERE | Builder source checks the pinned commit and byte-compares tracked `src`, `scripts`, and package inputs before/after packaging. The pinned upstream checkout is not included in the ZIP and Node.js is unavailable, so I could not independently rebuild or compare source inputs. |

## Review observations

- The builder is additive: it copies four Map modules, derives a separate build script from the upstream build script, switches the entry point, adds an artifact notice, and checks tracked upstream inputs against the pinned Git revision before and after. No actual build was run in this environment.
- Map imports `deriveJournalKeys`, `sealExport`, `openExport`, and notebook parsing/serialization from the bundled unchanged Journal module. Its export kind is `notebook`; the Map marker and guide are stored as ordinary notebook text. No new Journal schema or wallet-key access was identified in the reviewed paths.
- The code bounds encrypted file/page sizes, constrains accepted export iteration count, validates guide object depth/record counts and rejects prototype-related property names. Legacy VAULTFOLIO/1 import is separate. Static inspection is not fuzzing or a security certification.
- Guide text is appended as text nodes in the reviewed renderers. The explicitly sensitive `directAccess` value is a password input in the editor and is replaced with a masking string in Heir View until revealed. Revealed details are still present in JavaScript memory and rendered DOM while shown.
- Journal exchange is explicit through the existing Notepad field and an input event. The bridge creates a new page when the selected page is not marked as Map. Confirm the intended page is selected before loading or storing, especially in notebooks containing multiple Map pages.
- No demonstrated defect was established by this limited acceptance review. The outstanding checks above prevent a full PASS.

## Remaining limits

I did not open or drive Chrome, Safari, or Firefox for this run. This environment exposed no Node.js executable or browser automation interface. Therefore I could not execute the clean build, package tests, complete Mac GUI workflows, keyboard regression, async race cases, network/storage audit, or source-preservation comparison. The Chromium screenshots/log and validation claims are evidence supplied inside the ZIP and are identified as such above.

No real keys or user data were used. No changes were made. This is an acceptance review, not a security audit and not a claim of secure memory erasure.
