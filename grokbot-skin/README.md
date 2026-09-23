# Grokbot skin — work in progress

This directory contains preparation for a single-file Hermes Desktop plugin.
**There is no installable skin yet. No screen has passed visual verification.**

The intended visual authority is Thomas's running Grokbot Electron app. It could
not be located during initial discovery, and Computer Use access to Hermes was
denied. Implementation of the visual layer is waiting for that reference and
safe app access. Existing kit plugins and Hermes core files are unchanged.

## Prepared components

- An adaptation of the MIT [Codex Skin v1.8.1 updater](https://github.com/FPSUnleashed/hermes-codex-skin/tree/v1.8.1),
  with a separate Grokbot release channel, asset identity, checksum verification,
  rollback and reload verification. See [NOTICE](NOTICE.md).
- A reusable [electron-copy skill](../skills/electron-copy/SKILL.md).
- A [per-screen verification ledger](docs/VISUAL-VERIFICATION.md) and
  [integration constraints](docs/INTEGRATION.md).

The updater module and its automated tests are infrastructure, not evidence that
in-app updates work in a running skin. Installation, live updates, native behavior
checks and plugin-off restoration remain unverified.

Run the infrastructure checks from the repository root:

```sh
node --test grokbot-skin/test/*.test.mjs
```

## Remaining delivery

Capture Grokbot, implement the visual layer and native hook gates, package one
plugin with a checksum-verified installer, and run the actual-app comparison
loop for every screen. Only then publish an install command and a skin release.

Keep private captures outside the repository. The existing kit's default
installer does not install this unfinished component.
