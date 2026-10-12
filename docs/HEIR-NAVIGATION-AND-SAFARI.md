# Heir navigation patch and Safari input investigation

2026-10-12. Baseline: 6ab31e58c673e73256409c778a36eb2a0f1da36b.

## Status

Heir navigation, Editor/Heir switch and export return-home implemented and tested.
Owner authorized push and merge on 2026-10-12. Safari typing stopped reproducing
without a confirmed cause or targeted typing fix. No website deployment.

Owner confirmed section-02 field persistence and conceal/resume prompt in Safari.
Owner reported section-03 typing stops shortly after each click. The supplied
13.7-second recording shows the people form and adding an heir. It does not identify
the cause. Existing Chromium tests used fill(), which does not establish sustained
physical-key typing. New tests use individual keyboard events with delays and a
1.2-second pause followed by continued typing without another click.

## Heir change

All section titles, including owner instructions and Full reference, appear as
visible tabs above one content panel. Previous/Next remain optional. Switching
updates only the content panel and selection state; notes and navigation controls
keep their DOM identity. No unconditional scrollTo on section changes. Working
notes and per-section completion remain in the existing encrypted-backup format.
Reveal is masked on conceal; the selected section and notes survive resume.
Returning from the backup form retains the selected section. Standard tab roles,
roving tabindex, ArrowLeft/Right, Home and End are supported.

## Validation

Node 24.19.0: npm run build, npm test, npm run verify, build:map PASS.
Existing tracked EntropyLab inputs checked unchanged by the builder.
Chromium 153.0.8010.0: sustained typing in all three people fields, pause/resume,
all section tabs, notes DOM identity/value, completion retention, keyboard tabs,
conceal/remask and widths 1280/390 PASS. No page errors or HTTP(S) requests in the
public-build regression. No actual macOS Safari or screen-reader acceptance.
Playwright WebKit 26.5 downloaded but could not launch (bus error); NOT TESTED.
Real five-minute idle, actual bfcache and remaining host/Journal manual acceptance
remain open, as in the previous handoff.

Run the optional browser regression with:

    CODEX_PRIMARY_RUNTIME_NODE_MODULES=/path/to/node_modules CHROMIUM_BINARY=/path/to/chromium node tests/map-navigation-browser.cjs

MAP_HTML overrides the HTML path. MAP_BROWSER=webkit selects Playwright WebKit.
MAP_SCREENSHOTS optionally specifies a scratch directory. No test hooks ship.

## Separate diagnostic (not a fix or public release)

    node scripts/build-map-diagnostic.mjs /path/to/pinned/entropylab /separate/qa-output

This builds the normal artifact first, then a separate artifact importing
 tests/safari-focus-diagnostic.js, restoring the additive entry in finally.
It does not enable upstream test hooks or Journal. The public entry never imports
it. The diagnostic displays the last 12 event-metadata lines in RAM: elapsed time,
event type, element tag/id, document focus, and field connection/disabled/readonly/
focus flags. It never reads field values or key characters, writes browser storage,
exports plaintext, or calls the network. Pagehide clears the log.

## Review instructions

Kimi: review the Heir navigation diff and regression; verify notes/checklist schema,
privacy masking and lifecycle cleanup remain unchanged. Review diagnostics as a
separate QA tool, not a Safari fix. Safari regression cannot be closed from the
Chromium result. Owner decides any merge after review/testing.

Final diagnostic validation: the same Chromium GUI regression PASS against the
QA build, including no page errors/network and absence of invented field values
from the metadata log. Log uses a fixed-height read-only textarea so updates do
not move the user's click target. An initial variable-height diagnostic was caught
by the GUI regression and replaced before packaging.

Public HTML SHA256: 813451aa98299183480721d5587ee10d33838a2316c6fcbe21f2f57f49b0b5c0
QA diagnostic SHA256: e1fbae36863704d9f946a43e055ed9f435b8ba442a5a027bdf7b6066e3e79406


## Owner Safari results and final follow-up

Owner tested the public artifact with SHA256 813451aa98299183480721d5587ee10d33838a2316c6fcbe21f2f57f49b0b5c0.
They confirmed normal typing, section navigation, shared notes, separate retained
checkmarks, encrypted download/reopen preserving data, wrong-password rejection
and successful reopening with the correct password. These are owner-reported
Safari results, not automated Safari acceptance. The initial input cutoff has no
confirmed root cause and no targeted fix was applied.

The inert Done button now says Return to Map home and preserves the current guide.
A top-of-view Plan Editor / Heir View switch preserves in-memory edits, notes,
checks and each view's position. Switching clears visible passwords, invalidates
pending asynchronous operations, and remasks details. Session provenance and
Journal-lock wipe policy remain unchanged. Dirty state is no longer reset merely
by choosing the editor for the current guide.

Final validation: Node 24.19.0 build/test/verify/build:map PASS, upstream source
comparisons unchanged. Chromium 153.0.8010.0 navigation regression PASS including
the new switch, field/notes/check retention, remembered positions and remasking.
Deterministic session regression PASS including pending-export cancellation,
password clearing, dirty-state/provenance retention and Journal wipe after switch.
The owner has not yet manually tested the newly added toggle/return-home build.
Five-minute real idle, full Safari keyboard/screen-reader acceptance, real history,
host End-session and remaining Journal GUI acceptance remain unrun.

Final public HTML SHA256: f690b51671ef4f2515a5d463adf5b4d65d629f250f057e679cee5af63795c830
The earlier public/diagnostic hashes above identify the already-delivered review ZIP.
