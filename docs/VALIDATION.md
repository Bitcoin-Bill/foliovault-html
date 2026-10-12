# Validation and acceptance

Initial foundations: Folio ca65ca280a7d9ceb74ccd6c1dd509b1e32dcf577;
EntropyLab 289975672a7355a9376313a1a593252e67e1dcef (October 12, 2026).

The first combined build passed EntropyLab build and artifact verification.
Full EntropyLab tests: 2,228 pass, 9 skip, 1 failure due to no supported browser.
The adapter lifecycle test passed after its final layout edit.
Folio desktop baseline: 92 tests OK, 49 skipped for GUI/hardware prerequisites.
Existing Python/browser v1 round trip and shared catalog parity passed before
separating this HTML repository; those Python modules are not copied here.

The HTML tests cover large encryption round trip, notes/checklists, tampering,
wrong passphrase, validation rejection, privacy opt-outs and clear-session epochs.
The adapter test covers iframe isolation, local blob creation, teardown, URL revocation
and the fixed clear message. Build verification checks artifact/source equality and SHA256.
These tests do not prove the rendered UI or all asynchronous races work in a browser.

## Browser acceptance still required

Use invented data and disposable credentials on Mac Chrome, Firefox and Safari:

1. Standalone: create -> fill -> encrypt/download -> reopen -> editor/beneficiary.
2. Beneficiary: toggle steps, add notes, save an encrypted copy, reopen, verify both.
3. Long guides: verify export/download beyond 200 KB and file-size rejection.
4. Integrated host: open Folio guide; verify WebCrypto works inside its opaque iframe
   and encrypted downloads work with the sandbox permissions.
5. Hide/blur/idle: verify concealed display and direct-access masking on resume.
6. End during file read/decrypt/export; late work must not restore content/download.
7. Back-forward restoration must not revive decrypted guide data.
8. Host End session and panel close must remove Folio; reopening must start fresh.
9. Verify no guide data in storage and no network egress; test hardened offline
   settings, not just navigator.onLine. Test phone/desktop layout and keyboard access.
10. Independently review crypto, framing and browser residue before private plans.

Current browser acceptance and residue audit: NOT RUN in this environment.
