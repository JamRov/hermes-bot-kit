# Grokbot skin — development source

A single-plugin Grokbot layout for Hermes Desktop, inside Hermes Bot Kit.
**This is an unfinished source checkpoint. No screen has passed live visual
verification, no generated plugin is shipped yet, and nothing was installed.**

The visual authority is the six supplied Grokbot v0.30.0 screenshots. See the
[reference measurements](docs/REFERENCE.md) and the
[per-screen verification report](docs/VISUAL-VERIFICATION.md).

The candidate uses native Hermes chat/roster/settings hooks, official sidebar
navigation and composer contributions. It preserves native DOM ownership and
removes owned markers/styles on disposal. Bot Sections and Task Dock keep their
own state. No Hermes core file or saved native appearance setting is changed.

Current implementation covers layout primitives, bubbles, composer, native
roster/section styling, Settings shell and native navigation. The Grokbot
recipient picker and featured plugin catalog are unfinished. Account/billing
and computer-egress equivalents have not been established. Pixel parity and
native behavior still require running Hermes.

## Build and installation workflow

The build takes `src/skin.js` plus `src/update-runtime.js` and emits one
`plugin.js`, a byte-identical `desktop/plugin.js`, `plugin.yaml`, and
`CHECKSUMS.sha256`. On Thomas's Mac, run through the workload guard:

```sh
/Users/thomas/bin/ai-mac-heavy-job --kind build --task-id grokbot-skin-package -- \
  node grokbot-skin/scripts/build-updater.mjs
```

Elsewhere the build command is `node grokbot-skin/scripts/build-updater.mjs`.
The current Mac attempt was blocked by the guard's 15 GiB free-disk minimum.

**After a successful build**, the single-command local installer is:

```sh
bash grokbot-skin/install.sh
```

It needs Node.js, verifies SHA-256, module syntax and plugin identity before
replacement, backs up prior bytes and installs only
`~/.hermes/desktop-plugins/grokbot-skin/plugin.js`. `HERMES_HOME` must be an
app-level home, never a profile folder. Reload plugins in Hermes afterwards.
The root kit installer is unchanged. A remote one-command install must not be
advertised until generated artifacts are committed and live verification passes.

To disable, use the native plugin control. The palette also exposes
**Grokbot Skin: toggle** for the visual layer. To uninstall with a backup:

```sh
bash grokbot-skin/install.sh --uninstall
```

Then reload plugins. Exact live stock restoration remains a screenshot gate.

## Updates

The MIT [Codex Skin v1.8.1 updater](https://github.com/FPSUnleashed/hermes-codex-skin/tree/v1.8.1)
is adapted for this kit's isolated `grokbot-skin-vX.Y.Z` release lane and
`grokbot-skin-plugin.js` asset. It verifies checksum, byte count, identity and
version, preserves rollback bytes, and requires a reload receipt before success.
See [NOTICE](NOTICE.md). No release has been published and no live update cycle
has been proven. Native/network fixture tests are not that proof.

```sh
node --test grokbot-skin/test/*.test.mjs
```

Private reference screenshots stay outside public git history. Lifecycle and
integration constraints are documented in [INTEGRATION](docs/INTEGRATION.md).
