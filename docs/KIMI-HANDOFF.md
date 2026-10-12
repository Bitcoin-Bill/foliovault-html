# Kimi — independent Map integration/security review

Review the attached fixed Map review ZIP and its SHA256SUMS.txt. Use the source
snapshot in source/, not only the previously merged initial prototype on main.
Read README.md, map/, scripts/build-map.mjs, tests/map-compatibility.cjs and the
Map integration/validation docs. Upstream foundation is
OogaBoogaX/entropylab@289975672a7355a9376313a1a593252e67e1dcef.

Map is an optional native tab, built specifically as an EntropyLab add-on. The
owner prohibits modifying EntropyLab's existing tools, engine or Journal schema.
Official adoption is optional; the public may build/use the custom HTML without it.
The Linux desktop app and earlier standalone prototype are outside this review.

Review only: do not change code, push, merge, deploy, contact maintainers, open
issues or publish findings. Use invented fixtures. Identify actual findings with
file/function, severity, reproduction and practical impact; distinguish concerns
or untested assumptions from demonstrated problems. Do not certify security from
passing tests or assert guaranteed memory erasure.

Focus:
1. Does the builder leave every existing tracked upstream source/build/package
   input byte-identical? Is the pinned engine really reused? Confirm add-on inclusion
   vs omission and legal/source attribution in the custom artifact.
2. Existing encrypted notebook format only: key derivation/seal/open/parse imported
   from unchanged journal.js; no new kind, custom nonce, fake entropy/key record,
   weaker fallback or hidden host rewrite. Check password and iteration boundaries,
   malformed envelopes, size/depth/types, prototype pollution and legacy v1 handling.
3. Preserve all guide fields, notes/checklists and exact user strings across Map ->
   Journal -> encrypted re-export -> Map. Check key-reference glyph escaping and
   ambiguity when a notebook contains multiple Map pages.
4. UI/host boundary: no wallet-key or internal Journal-key access; selected-page
   exchange is explicit, does not overwrite ordinary notes, uses normal input events,
   and respects Journal lock/clear. Verify no sensitive data reaches control
   attributes, event logs, HTML sinks, network or browser storage.
5. Lifecycle: async generation checks on imports/exports; tab restoration; blur,
   hidden/idle concealment; pagehide/bfcache and End session. Review iframe-free
   DOM isolation and keyboard/aria behavior against the host patterns.
6. Heir View: recorded instructions read-only; notes/checklists editable and saved
   only in encrypted backups; direct-access details remain hidden until requested.
   Call out any mismatch with the desktop reference without inventing new behavior.
7. The pinned release hides Journal. The plugin must not enable it or ship debug/test
   hooks. Its notebook format can be accepted by the existing Journal-enabled build.
   Make clear whether adoption wiring is ready or additional host API work is needed.

Run available checks and independently establish expected results. Return
KIMI-MAP-REVIEW.md with PASS/CONDITIONAL PASS/FAIL, findings prioritized, tests run,
explicit unverified limits, and small proposed fixes. Stop after the report.
