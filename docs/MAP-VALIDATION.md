# Map review snapshot — October 12, 2026

Upstream EntropyLab: 289975672a7355a9376313a1a593252e67e1dcef.
Map repository baseline: 1bbc562fe9a8499b4d87a87c847211603bb3929b.
This snapshot supersedes the initial iframe companion. It adds a native optional
Map tab with shared host GUI/controls and existing encrypted notebook exports.

## Completed

- Custom build: all tracked upstream src/scripts/package inputs verified unchanged
  against the pinned commit before and after build. All existing engine/WASM,
  Journal, template and stylesheet inputs stay untouched.
- Plugin `npm run build`, `npm test`, `npm run verify`: PASS.
- Upstream `npm run test:ci`: 2,227 pass, 0 fail, 8 skipped (2,235 tests).
- Node compatibility: Map encrypted backup -> unchanged Journal open/parse ->
  Journal encrypted notepad re-export -> Map open; notes/checklists and unusual
  key-reference glyph strings preserved. Wrong/short password, tamper, ordinary
  notebook rejection, size bound and independent legacy v1 import exercised.
- Chromium 153 actual file:// UI: open original disclaimer, select Map, create
  guide, enter metadata, encrypted download, reopen in Heir View, add notes/check,
  encrypt new copy, load it via the original Journal Notepad Upload, recover it
  into Map Heir View. Light/dark/mobile screenshots captured. No JavaScript errors.
- Initial Map create/download/tab-switch UI flow observed no HTTP(S) requests.

## Limits / not claimed

The upstream full headless hosted+offline harness timed out waiting for its report
files in this environment. Targeted file:// Playwright flows passed; they are not
a substitute for that entire harness. An abandoned local prototype test was initially
left staged and tripped upstream's CI coverage guard; it was removed from staging,
then the unchanged upstream CI suite passed. No upstream tests were weakened.

The pinned production release hides Journal. Journal GUI acceptance used upstream's
own Journal-enabled test-build flag; the shipped artifact contains no test hooks and
does not reveal Journal or change this upstream policy. Map still works publicly
without Journal navigation through its own encrypted notebook backup/open flow.

Mac Chrome/Safari/Firefox acceptance, full keyboard regression, all async teardown
races, clipboard/OS/browser residue audit, malformed-file fuzzing, and independent
security review remain open. General Heir View parity with every desktop diagram or
editor safeguard is not asserted. The inherited guide-only scope and masking apply;
there is no Bitcoin recovery, signing or legal authority engine in Map.

No live site deployment or official EntropyLab adoption occurred. The review package
is a development snapshot. Use invented data and disposable passwords.
