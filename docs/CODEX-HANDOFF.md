# Codex — Map browser/build acceptance

Use the attached Map review ZIP as the source authority. Verify SHA256SUMS.txt.
Use its entropylab-map.html, not an older entropylab-folio.html or the prior main
branch prototype. Read README.md, docs/MAP-INTEGRATION.md and docs/MAP-VALIDATION.md.

Goal: verify that Map is a working optional EntropyLab tool on the owner's Mac.
Test and report against the fixed snapshot; do not edit, push, merge or deploy.
Never change EntropyLab's existing source, Journal schema or encryption engine.
Use invented plans and new disposable passwords only. Do not test with real keys.

1. Open downloaded entropylab-map.html directly in current Mac Chrome, then Safari
   (Firefox if available). Record browser/OS versions and artifact SHA256.
2. Verify startup disclaimers/checks, Map tab visibility, native GUI appearance,
   light/dark mode, narrow/desktop layouts and arrow/Home/End keyboard navigation.
3. Create a map, exercise each section/repeatable record and preset, and confirm
   ordinary EntropyLab tabs still work when leaving/re-entering Map.
4. Encrypted download -> close/reopen -> editor -> Heir View. Check instructions,
   private-detail masking, notes and checkmarks; encrypt/reopen and verify persistence.
5. Wrong password, corrupt file, ordinary notebook and desktop v2 must fail clearly.
   Check legacy VAULTFOLIO/1 imports and file/page size boundaries with fixtures.
6. Test Map home, tab switches, blur/hidden/idle concealment, pagehide/bfcache,
   End session and interrupting read/decrypt/export. No late completion may restore
   cleared guide data or trigger an obsolete download. Do not claim secure RAM erasure.
7. Journal-enabled builds only: create/open Journal with the Map backup password;
   Notepad -> Upload must accept the backup with the unchanged loader. Select Map
   page; Map -> Load selected Journal Map page must restore the guide. Store an
   update back to Notepad; encrypted Download notepad -> Map reopen must preserve it.
   Ensure ordinary note pages are not overwritten and lock/clear clears Map.
8. Inspect network activity and browser storage for guide data. Distinguish no
   application writes from browser/OS copies. No real clipboard secrets.
9. Rebuild from clean pinned EntropyLab using npm run build:map. Verify original
   source inputs remain identical. Omit the add-on and ensure the normal build stays
   normal. Do not activate hidden Journal tools in the public shipping artifact.

The pinned public release hides Journal: that is upstream behavior, not a Map bug.
For Journal GUI QA, upstream's existing --test-hooks flag can produce a separate
QA-only build; never distribute it as the public artifact. Ask for the owner's
actual Journal-enabled build if testing another version; don't pretend a hidden
Journal tab is available. Report unsupported engines explicitly.

Return CODEX-MAP-ACCEPTANCE.md: exact hashes/versions, PASS/FAIL per workflow,
steps/screenshots for failures, build/source-preservation evidence and remaining
limits. Stop after the report. Any fixes require a separate reviewed change.
