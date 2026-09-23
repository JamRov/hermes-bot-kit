# Grokbot Skin third-party notices

The updater runtime, updater bundling script, and initial updater regression tests
are adapted from [FPSUnleashed/hermes-codex-skin](https://github.com/FPSUnleashed/hermes-codex-skin),
MIT licensed, copyright 2026 FPSUnleashed. The full license is in `LICENSE` and
embedded in the standalone plugin by the updater build.

Changes include a public-only `thomasbek3/hermes-bot-kit` release feed, strict
`grokbot-skin-vX.Y.Z` release tags and `grokbot-skin-plugin.js` asset identity,
plain semantic build versions, bounded pagination across unrelated kit releases,
Grokbot-specific DOM names, additional identity and size checks, and unload safety.
No private access credentials or private update feed are used.
