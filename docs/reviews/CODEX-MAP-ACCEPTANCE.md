# Codex Map acceptance report

**Result: CONDITIONAL PASS.** I completed substantial live checks in the installed Chrome and Firefox apps using invented data. Safari interaction and the pinned rebuild remain incomplete; there is no demonstrated Map defect in the checks below.

## Artifact and test environment

- ZIP SHA-256: `3416ae3ef33f1d29b41e1e923d890073cf6fa5155b7c815d94672eff6783406b`
- Every ZIP entry listed in `SHA256SUMS.txt` validated successfully.
- ZIP and downloaded HTML contain the same Map build. HTML SHA-256: `874b473e329c0adfe99ed35446b34b3af8dc1ffc5b4fac230e012381cb49e7d5`.
- Mac: macOS 12.7.6 (21H1320). Installed browsers: Chrome 150.0.7871.125, Safari 17.6, Firefox 157.0.1.
- Chrome checks used the actual headful Chrome app and a disposable browser profile. Firefox checks used the actual GUI app and its built-in Marionette driver. Invented guide data and disposable passwords only; no real keys.

## Results

| Area | Result | Evidence / limits |
|---|---|---|
| Startup and Map tab | PASS in Chrome and Firefox | Completed EntropyLab’s two-step disclosure in fresh profiles, including the changing digit prompt. Map appeared as a native workspace tab. |
| Questionnaire and controls | PASS in Chrome and Firefox | Traversed all guide sections, exercised visible inputs, selects, checkboxes, repeatable records and vault preset controls. No page or console errors. Chrome’s visible-control pass covered sections 3–14; Firefox traversed sections 1–14 after the disclosure. |
| Keyboard and ordinary tools | PASS in Chrome | Home/End and both arrow boundaries moved focus/selection across the workspace tabs. Leaving Map selected an ordinary host tool; returning reopened Map. A full screen-reader and Tab-order audit was not performed. |
| Narrow and desktop layout, theme | PASS in tested browsers | Chrome at 390 px had document/body width 390 px and Map card width 346 px, with no horizontal overflow. Firefox window minimum was 500 px; no overflow at 500 or 1280 px. Theme toggle changed host theme in both browsers. The ZIP also contains prior light/dark/mobile screenshots. |
| Encrypted backup and wrong password | PASS in Chrome | Downloaded a 3,960-byte encrypted notebook. The fictional direct-access detail was absent from the downloaded plaintext envelope. Wrong password produced: “That encrypted export uses a different journal password, or the file is damaged.” Correct password opened the guide. |
| Heir View and progress | PASS in Chrome | Direct-access details were masked in the relevant Heir step and appeared only after selecting the reveal control. A new encrypted progress backup reopened with the invented note and the check for the same recovery step still selected. |
| Import/export interruption | PASS in Chrome | Navigated to Map home immediately after starting encryption and after starting correct-password decryption. No late download occurred; the interrupted import left Map home visible and did not restore the plan. |
| Concealment and session end | PASS with limits | Blur and a hidden-page visibility event concealed the guide. A pagehide event cleared it; a persisted pageshow restored a blank Map home. The host End Session confirmation closed the disposable Chrome tab. I did not wait five real minutes to test idle expiry. No secure RAM erasure is claimed. |
| Network and browser storage | PASS for observed session | Chrome request listener and Firefox resource entries showed no HTTP(S) requests during tested Map flows. No Map data appeared in local/session storage or IndexedDB. Only EntropyLab disclosure/theme/section UI preferences appeared in localStorage. This does not cover OS/browser copies, extensions, crash data or clipboard history. |
| Automated tests | PASS under a non-required runtime | Ran `folio_html.cjs`, `folio-panel.test.mjs` (1/1), and `map-compatibility.cjs`; all passed, including notebook round-trip, wrong password, tamper, size limit and legacy v1 fixture checks. They ran directly under Playwright’s bundled Node v20.18.0, not via npm and below the project’s declared Node 24 minimum. The supplied validation log separately reports the upstream CI results; I did not rerun that suite. |
| Journal-enabled GUI | NOT REPEATED | The pinned public artifact keeps Journal hidden. The bundle’s supplied Chromium log documents use of upstream’s QA-only Journal build; my independent tests did not activate hidden Journal tools. |
| Safari | NOT VERIFIED beyond opening | Safari 17.6 opened the local HTML. Its WebDriver was not configured: `safaridriver` requested `--enable`, which prompted for administrator authentication. I stopped without entering credentials or changing that system setting, so I could not interact with or inspect the Safari page. |
| Clean pinned rebuild/source preservation | NOT VERIFIED | No pinned EntropyLab checkout, npm, Node 24, or container runtime is available here. This Mac is on macOS 12.7.6; official Node 24 macOS binaries require macOS 13.5 or later ([Node.js 22→24 migration notes](https://nodejs.org/en/blog/migrations/v22-to-v24)). I inspected the builder’s before/after Git comparisons, but could not execute them. |

## Follow-up needed

Run Safari acceptance in Safari 17.6 (or a supported newer Safari) with the local file, including disclosure, Map tab, questionnaire controls, encrypted backup/open, Heir View and session cleanup. If Safari WebDriver is used, macOS requires an administrator-authenticated enable step; a direct manual browser session avoids changing that setting.

For an independent clean build, use a machine with Node 24+ support, install the pinned EntropyLab checkout at `289975672a7355a9376313a1a593252e67e1dcef`, then run the documented `npm ci`, `npm run build:map`, tests and source-preservation comparisons. The tested Mac’s macOS version cannot run the official Node 24 macOS binaries.

No files in the review ZIP or application source were changed. This report does not certify security or memory erasure.
