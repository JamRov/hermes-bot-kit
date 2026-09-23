# Integration constraints

## Source revisions

- Bot Kit starting commit: `4bfdd1b`, fetched and equal to `origin/master` on
  2026-09-23.
- Codex Skin: `53f3e32`, v1.8.1; updater source is the reusable component.
- Brooklyn skills: `c1a6dbe`; use `ui-only`, `ui-system`, `visual-verify` and
  its screenshot-overlay procedure. They are already mounted on Thomas's host.

## Plugin ownership and compatibility

Use plugin ID and directory `grokbot-skin`, under the app-level
`desktop-plugins` root. Do not install into a profile. A single generated
`plugin.js` must import only supported SDK/React modules. The reference uses
`useQuery` from `@hermes/plugin-sdk`, not a separate query-library import.

Register cleanup before installing behavior. Check the full hook set before
applying layout; remove owned markers/styles if that set disappears. Native
model selection, Thinking Level, Queue, approval and session state are never
written or reconstructed by the skin. Scope changes to the active surface and
ignore `data-pane-hidden` ancestors.

The kit documents a React `removeChild` failure after native DOM reparenting
in `bot-sections/docs/BUILD-NOTES.md`. Use official contributions and CSS layout
to restructure the UI. Never detach, wrap, replace or move React-owned rows,
composer controls or messages. Added nodes must be plugin-owned.

Bot Sections owns `data-hermes-bot-section-list`, section header/pin markers,
row order and collapse state. Task Dock owns `data-hermes-task-dock` and
`data-hermes-task-dock-source`; do not duplicate or unhide the source widget.
Avoid broad status-stack hiding: that region also holds approvals, subagents,
goal, loop and heartbeat controls. Preserve the Bubble Mode edit/attachment/
rich-content exemptions when integrating its bubble language.

Do not copy the Codex theme, 736px composer or its visual chrome into Grokbot.
Measurements must come from Grokbot. Do not rewrite saved native appearance
settings to simulate plugin styling; disposal must restore the prior surface.

## Updates and packaging

Use only `thomasbek3/hermes-bot-kit` releases tagged `grokbot-skin-vX.Y.Z`,
with asset `grokbot-skin-plugin.js`. Ordinary kit date releases must never be
offered as skin updates. The plugin build identity is plain `X.Y.Z`.

Preserve bounded downloads, GitHub asset identity, SHA-256, byte count, plugin
identity, rollback backup and verified hot reload. A successful file write is
not proof that new code loaded. Dispose fetches, subscriptions and timers when
the plugin unloads. No private release feed or token handling is needed.

The initial installer must stage and verify before touching the live plugin,
back up a different installed version, replace atomically and avoid all other
plugins. Extend the kit's existing manifest/installer convention rather than
introducing an unrelated installation system. The root kit installer remains
unchanged until integration is ready. Catalog installation additionally needs
`plugin.yaml` and a byte-identical `desktop/plugin.js`, as in the reference.

## Packaged Hermes hooks inspected

The installed SDK bundle allows `@hermes/plugin-sdk`, `react`,
`react/jsx-runtime` and `react/jsx-dev-runtime`. It exposes synchronous plugin
storage, `ctx.onDispose`, `ctx.register` and `composer.leading`. The preload
contains the three updater bridge methods. These are code-level findings,
not proof that a live update succeeds.

Current packaged approval hooks include `tool-approval-stack`,
`data-approval-stack`, `data-approval-placement` and `tool-approval-actions`.
The older `tool-approval-inline` string was absent. Test visibility against the
current approval stack; a guard based only on older selectors is insufficient.

Style lifetime should follow plugin registration rather than a route-mounted
contribution. Cleanup must be idempotent and protect a newer hot-reloaded
generation. Restore previous native attribute/property values only while the
mutation remains owned by the current runtime.

## Evidence gate

Compatibility claims require running Hermes, not just its bundle version or
source selectors. The installed bundle's metadata reported 0.17.6, but local
builds can carry stale package metadata; do not infer compatibility from it.
Verify hooks and native behavior in the actual app after access is available.

Actual Grokbot and skinned-Hermes screenshots, per-state overlays, native
interaction checks, plugin-off restoration and a live updater cycle are required
before shipping. See `VISUAL-VERIFICATION.md` for the current blocked state.
