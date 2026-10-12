# Map — an EntropyLab plugin

**Map** is an optional inheritance-guide tab for EntropyLab. It adapts the
Vault Folio questionnaire, risk review, editor and Heir View to EntropyLab's GUI.
It documents the recovery map: people, arrangements, backup hints and instructions.
It does not create wallets, sign transactions or request wallet signing secrets.

This is an independent experimental add-on, not an official EntropyLab release or
an audited security product. Start with invented data. Sensitive information must
only be entered on a trusted fully air-gapped machine.

## Include it or omit it

- **Included:** a custom single-file EntropyLab build adds **Map** on the tool line.
  Forms use EntropyLab's existing styling, controls, privacy protections and session
  lifecycle. There is no iframe or second application window.
- **Omitted:** build EntropyLab normally; the original tool set remains unchanged.
- The EntropyLab team may adopt the module; the public may use the separately built
  EntropyLab-with-Map file without any change to the official site or repository.

No existing EntropyLab source file, cryptographic engine, Journal schema or tool
logic is edited by the add-on build. An additional entry module loads the original
app and registers Map after the host boot checks pass. The builder verifies every
tracked upstream source/build/package input against the pinned commit before and
after packaging. The custom artifact has its own hash: upstream attestations and
checksums do not authenticate it.

## Build the custom HTML

Node 24+ is required. EntropyLab's original dependencies are installed in its own
checkout, using its existing lockfile. This repo adds no production dependencies.

```
git clone https://github.com/OogaBoogaX/entropylab.git ../entropylab
cd ../entropylab
git checkout 289975672a7355a9376313a1a593252e67e1dcef
npm ci --ignore-scripts
cd ../map
npm run build:map -- ../entropylab
```

Output: `dist/entropylab-map.html`. Download/verify online, transfer to the offline
machine, and open locally in a supported browser. Select **Map** on the tool line.
Do not rely on the chat preview for browser behavior.

The original standalone Folio prototype remains under `src/foliovault.html` for
history and legacy evaluation. `npm run build` produces that earlier standalone
artifact; **`npm run build:map` builds the new EntropyLab plugin**.

## Create, back up and recover a Map

1. Select Map, then **Create inheritance guide**. Work through the section picker.
2. Document arrangements, contacts and backup hints. Never enter Bitcoin seeds,
   private keys, wallet seed passphrases, full xpubs or wallet descriptors.
3. Review the missing information and risks. Use **Back up Map** and a dedicated
   strong password to download `map-notebook.json`.
4. Reopen the encrypted file through Map and choose editor or **Heir View**.
5. Heirs may add working notes and progress checks. Back them up in a new encrypted
   copy. Existing files are not overwritten automatically and older copies remain valid.

## Journal compatibility

Map backup files use EntropyLab's **existing encrypted notebook export format**:
`sealExport('notebook', ...)` and its unchanged Journal key derivation. No custom
Journal method, new encrypted export kind, fake key entry or alternate crypto engine
is introduced. Password protection is required for Map's own backup download.

In a Journal-enabled build:

1. Create/open a Journal using the same password that protects the Map backup.
2. Select **Journal → Notepad → Upload**, then choose the Map backup.
3. The unchanged Journal loader decrypts it into a page named **Map**.
4. Select that page, switch to Map and choose **Load selected Journal Map page**.
5. To return updated data, use **Store Map page in Journal Notepad**. It updates the
   selected Map page, or creates a new page rather than overwriting ordinary notes.
6. Use the existing encrypted **Download notepad** action to preserve those pages.
   Keep its encryption checkbox enabled; an unprotected Journal password offers no
   access protection. This is EntropyLab's existing behavior, not changed by Map.

**Download journal entries is not Download notepad.** EntropyLab stores these in
separate exports. Map does not silently change the meaning of either action.

The pinned upstream production build currently hides the Journal tab. Map does
not enable hidden tools or alter that policy. Public users can still use Map's
backup/open workflows. The Journal loader handshake was tested with upstream's
own Journal-enabled QA build, using the same unmodified loader/engine. Map's
Journal buttons appear when the host exposes Journal. Team adoption can register
Map in the team's normal Journal-enabled build.

Notebook text contains an `ENTROPYLAB-MAP/1` marker and validated guide JSON;
key-reference marker characters are escaped so the notebook renderer cannot
rewrite guide strings. The original Journal stores it as ordinary notebook text;
Map supplies the form/Heir interpretation. A backup opened directly in Map must
contain exactly one Map page; for a notebook with multiple maps, select the desired
page in Journal first. Legacy VAULTFOLIO/1 imports remain supported. Desktop v2,
YubiKey and question-set unlock remain unsupported.

## Privacy and scope

Map inherits host boot/WASM tests, shared GUI controls, theme, translation and
writing-service opt-outs, and End session behavior. Additional Map hooks clear
its state on pagehide/bfcache restoration and Journal lock, invalidate pending
imports/exports, and conceal the guide on blur, hidden-page or five-minute idle.
No guide or credential is intentionally written to browser databases or sent over
the network. There is no plaintext Map download or new clipboard API.

JavaScript/DOM/editor copies, browser extensions, clipboard history, OS swap,
hibernation and crash dumps are outside what an HTML tool can erase. Quit the
browser completely and shut down after use. Memory cleanup is best effort; no
memory-residue audit or independent security certification is claimed.

## Tests and review

```
npm run build
npm test
npm run verify
```

These include unchanged-Journal compatibility, rejected passwords/tampering,
legacy v1 import and guide limits. See [Map validation](docs/MAP-VALIDATION.md) and
[maintainer integration](docs/MAP-INTEGRATION.md). Independent review reports and the remaining work are tracked in
[Collaborator follow-up](docs/COLLABORATOR-FOLLOWUP.md). Kimi reports PASS for the
custom artifact, including a byte-identical rebuild. Codex reports CONDITIONAL PASS
with live Mac Chrome/Firefox checks; Safari remains unverified. Six minor findings
remain open, including unsaved Map work being cleared on Journal lock in
Journal-enabled builds. Official adoption still requires a host integration agreement. The prior prototype evidence is retained in docs/VALIDATION.md.

## Licenses

Map's Folio-derived code is MIT; retain LICENSE and the generated artifact notice.
EntropyLab is dedicated to the public domain under its Ooga Booga license;
`integration/LICENSE-ENTROPYLAB.txt` is retained. Original dependency notices remain
in the custom build. This project does not imply endorsement by Team Ooga Booga.
