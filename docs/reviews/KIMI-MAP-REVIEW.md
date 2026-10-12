# KIMI-MAP-REVIEW — Map (optional EntropyLab add-on)

**Verdict: PASS** for the custom-artifact route (the public `entropylab-map.html` build), with six minor (P3) observations, none security-relevant and none blocking. Official-adoption wiring is **not ready** by design — it binds stable DOM IDs and needs a host-side plugin slot or a checked foundation update (the project's own docs say the same). Details below.

- Review date: 2026-10-13
- Reviewer scope per KIMI-MAP-HANDOFF.md: review only. No code changed, nothing pushed/merged/deployed/published, no maintainers contacted. All fixtures invented; disposable passwords only.
- Materials: `map-entropylab-review.zip` + `SHA256SUMS.txt` (every entry verified, zero failures), `source/` snapshot, `entropylab-map.html` (sha256 `874b473e329c0adfe99ed35446b34b3af8dc1ffc5b4fac230e012381cb49e7d5`), draft PR #2 head `1218dce` (all files common to zip and PR byte-identical), upstream `OogaBoogaX/entropylab@289975672a7355a9376313a1a593252e67e1dcef` freshly cloned.

Passing tests below are not a security certification; memory erasure in a browser is best-effort (upstream's own End-session documentation states wiping cannot reach strings, DOM text, or browser copies — only closing the tab fully helps). Nothing in this review asserts guaranteed erasure.

---

## 1. Builder integrity (focus 1) — verified

- `map/upstream/journal.js` and `map/upstream/coders.js` are **byte-identical** to the pinned upstream checkout (`sha256 ed9829f3…` / `776b3e5c…` on both sides).
- `integration/FOUNDATION.json` pins verified: `entropyCommit` matches the checkout HEAD; both `upstreamModules` hashes (`text-services.js`, `conceal-on-leave.js`) match the pinned tree.
- I ran `node scripts/build-map.mjs /tmp/entropylab` against a fresh pinned checkout (`npm ci`, esbuild 0.28.2). The builder:
  - refused nothing incorrectly and completed: pre-build and post-build loops compare every tracked `src/`, `scripts/`, `package.json`, `package-lock.json` file against `git show HEAD:<path>` and abort on any difference;
  - copies only four additive files into `src/js/` and writes a **separate** `scripts/build-with-map.mjs` (entry point swapped to `map-entry.js`, license banner appended) — `scripts/build.mjs` itself is never overwritten;
  - produced `dist/entropylab-map.html` with sha256 `874b473e…` — **byte-identical to the uploaded artifact**. The artifact is exactly what the pinned sources produce; build is reproducible.
- Post-build `git status`: only the four untracked Map modules + untracked wrapper script + a modified `entropylab.html` (a tracked **generated output** — the byte-identity check intentionally covers source/build/package inputs, not this output). Running the upstream `node scripts/build.mjs` afterwards regenerated `entropylab.html` byte-identical to HEAD (`git diff` clean), confirming no tracked source was touched and the stock build is itself reproducible.
- Add-on inclusion vs omission: stock build = no Map tab; Map build = Map tab present (grep + live UI). Omitting the module omits the tab, as documented.
- Attribution: artifact embeds the `/*! Map — an EntropyLab plugin … MIT License */` banner; `integration/LICENSE-ENTROPYLAB.txt` is byte-identical to upstream's LICENSE (The Ooga Booga License; upstream `package.json` says "Unlicense" while shipping that text — upstream's own inconsistency, not Map's).

## 2. Encryption / notebook format (focus 2) — verified

- Map imports and uses the unchanged journal.js functions only: `deriveJournalKeys` (default 600,000 iterations), `sealExport('notebook', …)`, `openExport`, `parseFile`, `serializeNotebook`, `parseNotebook`, `wipeBytes`. **No new export kind, no custom nonce** (the synthetic-IV scheme is inherited untouched), **no fake entropy/key record** (a Map backup is an ordinary notebook page of kind `notebook`), no weaker fallback, no host rewrite.
- Map is *stricter* than the host where it adds rules, never weaker:
  - Export password must be ≥12 chars (journal.js itself permits even a blank password); 0- and 11-char passwords rejected, 12 accepted (probed).
  - Open path accepts **exactly** 600,000 iterations. Probed tampered envelopes with 100,000 / 599,999 / 600,001 / 10,000,000 — all rejected `Unsupported encryption cost.` (journal.js would accept 100k–10M; Map narrows). Maintenance note: a future upstream bump of `JOURNAL_ITERATIONS` would require a Map update — deliberate hardening, not a defect.
- Malformed-envelope probes (all rejected with safe generic errors): empty object, export-flag-only, bad/short/non-hex IV, empty ciphertext, wrong kdf/cipher strings, array envelope, >10MB envelope, wrong-kind export (`session-log`), wrong password, flipped ciphertext byte (also covered by the shipped test).
- Legacy `VAULTFOLIO/1` path (`decryptLegacyPlan`, map-native.js:556-575): strict envelope shape (exactly 4 keys), fixed PBKDF2-SHA-256/600,000/AES-256-GCM enforced, salt=16B/iv=12B length checks, canonical-Base64 rejection, size caps, fatal UTF-8 decode, plaintext and password-byte wiping. Probes: extra key, lowered iterations, wrong hash, short salt, non-canonical Base64 — all rejected. Positive interop with an independently produced Node-crypto v1 file passes (shipped test).
- `wipeBytes` applied to `keys.verify`, parsed IV/ciphertext copies, and legacy plaintext/password buffers. CryptoKeys are non-extractable. Residual JS strings are unwipeable by nature (see erasure caveat above).
- Document validation (`prepareBrowserPlan`): nesting depth >30 rejected, arrays >500 rejected (probed at 501), `__proto__`/`constructor`/`prototype` keys rejected with no pollution observed on the global object, per-section type checks, vault quorum limited to integers 1–100, record fields constrained to strings (heir checklist to booleans). Unknown fields are preserved for forward compatibility, as documented.

## 3. Round-trip preservation (focus 3) — verified

- Shipped `tests/map-compatibility.cjs` (ran it myself, PASS) proves: Map encrypted backup → unchanged Journal `openExport`/`parseNotebook` → Journal encrypted re-export → Map `decryptPlan`, preserving notes, checklist, and a deliberately hostile string containing `◆◆ Fixture [abcdef12]\u2063` — key-reference glyphs cannot be misread as Journal key tokens because `mapPage` escapes `◆ ◈ U+2063` to ASCII `\uXXXX` sequences inside the JSON (journal.js glyph parsing sees plain text; `JSON.parse` restores the originals on open).
- Ambiguity with multiple Map pages: a notebook containing **two** Map pages is rejected (`The backup must contain one Map page.` — probed). A notebook with one Map page plus ordinary pages opens fine, ordinary pages untouched (probed). A non-Map page handed to `readMapPage` is rejected with a select-the-Map-page message (shipped test).
- Journal-bridge store path (`map-addon.js:10-16`) writes only to a page already carrying the Map marker, or clicks `add-journal-page` and refuses unless the new page is empty — **ordinary notes are never overwritten**; the write goes through the textarea's normal bubbling `input` event.

## 4. UI / host boundary (focus 4) — verified

- Static scan of `map/*.js`: no `fetch`/`XMLHttpRequest`/`WebSocket`/`sendBeacon`/`localStorage`/`sessionStorage`/`indexedDB`/`cookie`/`navigator`/`location` usage. Downloads use a local Blob object URL only. Live UI run observed **zero HTTP(S) requests** and zero console errors.
- Artifact CSP is upstream's unchanged policy (`default-src 'none'; connect-src 'none'; …` — no `frame-src` addition; the iframe-based predecessor is absent from this artifact).
- No iframe, object, or embed anywhere in Map code; the panel is plain DOM inside the host workspace.
- `innerHTML` appears only as `=''` clearing; all user text reaches the DOM via `createTextNode` — no HTML sink.
- Inputs carry privacy attributes (autocomplete off, `data-1p-ignore`, `data-lpignore`, etc.); `data-folio-path` carries schema paths, never values. No Journal `appendLog` calls, no access to host key material, Journal CryptoKeys, or internal state — the bridge touches only documented DOM IDs (`journal-global-download.disabled` as the lock boundary, `journal-notes-text`, `add-journal-page`), each on explicit user action.

## 5. Lifecycle (focus 5) — verified (live + static)

- Async generation: export, decrypt, and file-read capture `sessionEpoch` and check `sessionCurrent(epoch)` before touching the DOM/download; successful decrypt bumps the epoch, invalidating stragglers.
- Concealment: upstream `conceal-on-leave.js` wired with `concealNativeFolio` (blur / visibilitychange-hidden / 5-min idle). Verified live: blur → card hidden + resume notice; resume → content intact.
- `pagehide`: both handlers clear the session (fields emptied, plan reset, pending work invalidated) — verified live (card emptied to 0 children). Host End session dispatches `pagehide` (upstream `end-session.js:103`), so Map clears there too, before the host retires its modules.
- bfcache: `pageshow` with `persisted` re-clears and re-renders home. Verified live with a real navigate-away/go-back (`back_forward`) cycle: Map tab reopened to a fresh home, previous plan gone.
- Tab coexistence: host panels/tabs snapshot-and-restore on open/close (verified live — switching away and back preserves Map state and restores host panels); keyboard glue adds the Map tab to the host's arrow/Home/End rotation (verified: `End` from the first tab lands on Map, `aria-selected=true`), with `role=tab/tabpanel`, `aria-selected`, `aria-controls/labelledby` matching host patterns.

## 6. Heir View (focus 6) — verified as implemented

- Recorded instructions render read-only (text steps + full-reference runbook); only `heirNotes` and `heirChecklist` are editable, and they persist solely through a new encrypted export ("Back up notes and progress" routes to the unchanged encrypt flow) — nothing is written to Journal or storage.
- `directAccess` details are masked (`[Hidden: choose Show direct access details to reveal]`) until the reveal checkbox; conceal resets the reveal (`concealHeir`).
- Desktop-reference parity beyond these behaviors is **not asserted** (the project's validation doc says the same); I did not diff against the desktop app's beneficiary pages feature-by-feature. No new behavior invented.

## 7. Journal-hidden policy & adoption readiness (focus 7) — verified

- Pinned release gates the Journal tab behind the compile-time `__ENTROPYLAB_TEST_HOOKS__` define (`app.js:14524`, comment: "held back from release navigation… Test builds keep Journal reachable"). The shipped Map artifact contains **zero** occurrences of that flag and no Journal tab (the only `data-workspace="journal"` string in the artifact is Map's own bridge selector); grep for debug/test hooks is clean (the `syntheticTest` code is an *import-blocking guard*, not an enabler; `TEST_MODE` is a hardcoded `false` constant).
- Map neither enables Journal nor ships hooks; without a Journal tab the bridge reports unavailable and the export step tells the user so, file-first flow fully working (verified live).
- Format acceptance by the existing Journal-enabled build is established at the format level (compat test's open/parse/re-export cycle through unchanged journal.js). **Adoption wiring is not ready**: registration depends on host DOM IDs, not a plugin API; official adoption needs a host-side optional-tool registry or a checked foundation update, exactly as `docs/MAP-INTEGRATION.md` states.

---

## Findings (all P3; none block the custom-artifact route)

1. **P3 cosmetic — `el()` silently drops `style` attributes.** map-native.js:69 (`if(k==='style')continue;`) vs ≥6 call sites passing `style` (e.g. lines 240, 297, 475, 484, 666). Effect: intended inline styles never apply — most visibly the quorum M/N inputs (line 297) stack vertically instead of the intended flex row. Fix: delete the skip or move those styles to classes.
2. **P3 dormant — `prepareExportPlan` is never called** (defined map-native.js:898). The synthetic-test-file guard exists on the *open* path (`checkOpenBoundary`, enforced) but not on the export path. No route to a synthetic plan exists in the shipped artifact (`adoptJournalFolio` is exported but uncalled), so this is dead defense-in-depth. Fix: call it in `encryptPlan` or remove it.
3. **P3 — vestigial test-mode constants.** `checkOpenBoundary(plan, TEST_MODE)` passes an argument the function doesn't declare (line 764); `TEST_MODE`/`TEST_MARKER` are compile-time dead. Fix: drop the parameter and constants.
4. **P3 UX/data-loss edge — Journal lock wipes unrelated Map work.** map-addon.js:55-59 calls `lockJournalFolio()` (full session clear) on any unlocked→locked transition, even if the Map plan was authored independently of Journal, with no confirm. Fail-closed and documented, reachable only in Journal-enabled builds. Fix (at adoption): scope the wipe to journal-sourced plans, or confirm first.
5. **P3 unreachable-in-practice — double `pagehide` clear ordering.** map-addon.js:60 clears *after* initNativeFolio's handler re-rendered home, leaving the card empty if a `pagehide` is ever observed without a following navigation/pageshow. Real flows re-render via the `pageshow(persisted)` path (verified). Fix: make `close()` skip its extra clear, or reorder.
6. **P3 — `renderExport` re-enables its button across session change** (`finally { save.disabled=false }`, line 593). The download itself is epoch-guarded; cosmetic only. Fix: guard the re-enable with `sessionCurrent(epoch)`.

## Tests run (this review)

- `npm test` in `source/`: `tests/folio_html.cjs` PASS, `tests/folio-panel.test.mjs` PASS (1/1), `tests/map-compatibility.cjs` PASS. (Node 20.20.2; engines ask ≥24 — no engine-strict enforcement, suite green regardless.)
- Independent probe script (vm harness, invented fixtures): 20+ negative/edge cases — iteration tampering ×4, 8 malformed envelopes, oversize, prototype pollution, depth/array limits, multi-Map-page rejection, mixed notebook acceptance, wrong-kind rejection, 5 legacy-v1 parameter violations, password length boundaries. All behaved as designed (an initial probe-script bug of mine — a string-splice precedence error — falsely showed iteration tampering accepted; corrected and confirmed rejected).
- Builder: full run against a fresh pinned checkout; artifact byte-identity vs the uploaded file; stock rebuild restores the tracked generated HTML byte-identical.
- Live Chromium UI (`file://`, reproduced artifact): real two-step disclaimer gate, Map tab install/open/close, editor state across tab switches, blur-conceal/resume, synthetic pagehide wipe, real bfcache back-navigation restore, End-key tab rotation. Zero console errors, zero network requests.

## Unverified limits

- Journal-enabled **GUI** flows (Notepad store/load buttons, lock-transition wipe) were not exercised — the pinned release hides Journal; the project's Chromium QA-build flows (MAP-VALIDATION.md) cover them, and I verified the format level only.
- Upstream's full `test:ci` suite (2,227 tests claimed) was not re-run here; I relied on its existence plus my targeted runs.
- Firefox/Safari/macOS acceptance, full keyboard regression, clipboard/OS/browser residue audit, and malformed-file fuzzing remain open (consistent with the project's own "Limits / not claimed").
- Heir View feature-parity with the desktop reference is not asserted.
- Passing tests are not a security certification; browser memory erasure is best-effort and not guaranteed.

## Proposed fixes

Small, optional, in the findings above (each one- to three-line). None required before continued public use of the custom artifact; worth folding in before any official-adoption PR.

— Review ends here per the handoff; no code changed, nothing submitted.
