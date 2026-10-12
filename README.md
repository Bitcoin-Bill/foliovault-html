# FolioVault HTML

Experimental offline HTML inheritance guide and EntropyLab companion. This is
separate from [Vault Folio desktop](https://github.com/Bitcoin-Bill/vault-folio).
It documents the recovery map; it does not create wallets or sign transactions.
Never enter Bitcoin seeds, private keys, wallet seed passphrases or full xpubs.

## Try it

Start with invented data and a new test passphrase. Run `npm run build`, then
open `dist/foliovault.html` in a supported modern browser. No server is required.
Create a guide, review the gaps, download an encrypted `.csp.json`, reopen it,
and choose editor or beneficiary view. Notes and checklist progress require a
new encrypted download. Nothing is autosaved and original files are not overwritten.

Sensitive information must only be entered on a fully air-gapped machine.
Download and verify on a separate online computer, then transfer for offline use.
There are warnings, but no network/Bluetooth/OS environment restrictions in this
HTML edition. The desktop app keeps its separate enforcement requirements.

## Safeguards and limits

No guide/credential storage in browser databases, cookies or the network. Only
encrypted guide downloads. EntropyLab privacy opt-outs and translation detection,
blur/hidden/idle concealment, pagehide/bfcache cleanup and cancellation epochs are
included. Byte-buffer cleanup is best effort; immutable text, browser editor history,
clipboard copies, extensions, swap/hibernation and crash dumps are outside its control.
Close the tab, quit the browser completely and shut down after use. This does not
prove all copies were erased. No browser residue audit was performed on this build.

Passphrase-only VAULTFOLIO/1: AES-256-GCM, PBKDF2-SHA256 (600,000 rounds), fresh
random salt/IV, minimum 12-character export passphrase. Version 2, YubiKey and
question-set unlock remain unsupported. Older copies remain usable after re-export.
The exported file's passphrase is the one entered at export; notes may therefore
be saved under a different passphrase from the original file.

## EntropyLab integration

The foundation is pinned in `integration/FOUNDATION.json`. The integrated build
uses EntropyLab's actual source and existing esbuild pipeline, with Folio embedded
in an opaque sandboxed iframe. There is no transfer of wallet/journal/guide data.
The host's only message is a fixed clear command. Panel close and host End session
tear it down; reopening starts fresh.

Obtain a clean local checkout at the pinned EntropyLab commit, then run:

```
node scripts/prepare-entropylab.mjs /absolute/path/to/entropylab
```

Run the build/test commands printed by that script in the EntropyLab checkout.
Its generated `entropylab.html` includes the Folio guide button and works as one
self-contained file. Do not edit the generated host HTML or publish it as an
unmodified official EntropyLab release. Upstream attestations do not cover it.

**Integration policy difference:** EntropyLab prohibits browser randomness,
including salts. Folio retains random encryption salts/nonces for its existing
format. This requires explicit maintainer review before upstream adoption. No
wallet entropy is generated. Never replace these with fixed GCM nonces.

## Checks

```
npm run build
npm test
npm run verify
```

Node 24+, no npm dependencies. See [validation](docs/VALIDATION.md) for original
results and unfinished browser acceptance. CI covers these local HTML checks only;
it does not certify the integrated host or browser-memory behavior.

## Review and licenses

Development snapshot, not an audited or production-ready release. Review through
PRs. This repo does not deploy the live EntropyLab site.
Vault Folio code is MIT. EntropyLab safeguards are public-domain code under its
Ooga Booga dedication; the integrated host retains its dependency license notices.
Retain LICENSE, integration/LICENSE-ENTROPYLAB.txt and embedded source notices.
