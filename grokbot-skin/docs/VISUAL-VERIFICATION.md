# Visual verification ledger

2026-09-23 resume: **BLOCKED — six reference images inspected, zero actual
skinned-Hermes captures, zero screens passed.**

Brooklyn `ui-only`, `ui-system`, `visual-verify` and screenshot-overlay
instructions were read and applied to the evidence contract. Its skill folder
is still present in Hermes `skills.external_dirs`.

The user's approval to use Hermes on an empty chat or Settings is explicit.
However, the Computer Use runtime rejected direct Settings navigation against
`/Applications/Hermes.app` with **“Computer Use was not approved to use Hermes.”**
Discovery confirms the running app's ID is `com.nousresearch.hermes`; that ID
cannot be targeted because installed backups share it. No alternate screenshot,
CDP, AppleScript or private-chat route was used. The permission question is
pending. No user chat was opened or captured.

The required `ai-mac-heavy-job` packaging invocation waited with
`disk_free_below_15_gib`. Its exact owned waiting process was stopped. No package
was generated or installed, and the guard was not bypassed or reconfigured.

| Screen/state | Candidate source work | Actual-app comparison | Result |
| --- | --- | --- | --- |
| Main chat/sidebar | Reference palette, 280px roster, native rows/sections, chat margins and bubbles | No running capture | BLOCKED |
| Account menu | Native dropdown/popover geometry; profile switching retains its real meaning | No capture; Grokbot account/billing actions have no established native equivalent | BLOCKED |
| Settings General | Native overlay shell, 198px rail, spacing and appearance fields; native Settings navigation | No capture; native grouping differs from Grokbot account/system sections | BLOCKED |
| Settings Computer | Shared native overlay styling only | No capture; no established Hermes egress control | BLOCKED |
| New chat/picker | Empty native chat/composer retained | Grokbot recipient picker not implemented; no public native picker opener | BLOCKED |
| Plugins | Native navigation and overlay shell retained | Native catalog is a cross-origin iframe, not a restylable featured grid | BLOCKED |
| Composer empty/multiline/attachment | Pill surface and native input/buttons; model, Thinking and status controls retained | No capture or native interaction checks | BLOCKED |
| Typing/loading | Native loading container styled; no simulated activity | Missing reference and live capture | BLOCKED |
| Sections collapse/selection | Native state/handlers retained | Missing reference and live capture | BLOCKED |
| Task Dock | Styles existing kit-owned dock, no duplicate store | Missing reference and live capture | BLOCKED |
| Models / Thinking / Queue / approvals / sessions | No state writes or handler replacement | Not functionally exercised | BLOCKED |
| Menus / palette / errors / split panes | Native behavior retained in source | Missing reference and live capture | BLOCKED |
| In-app update / recovery | Existing controller wired to SDK composer slots | Mocked updater tests only; no live release or hot reload | BLOCKED |
| Plugin off / stock restoration | Owned attributes/styles and observers disposed; storage race fixed | Lifecycle tests pass; screenshot and native interaction proof absent | BLOCKED |

## Automated evidence (separate from visual verification)

- 14 lifecycle tests pass: hook loss, hidden/foreign panes, route-gated overlays,
  unknown-page fallback, exact attribute restoration, startup disabled state,
  stale storage, exception cleanup and hot-reload ownership.
- 33 installer/build/updater tests pass: staged verification, identity/digest
  checks, backups, rollback, bounded downloads, release-channel isolation and
  reload receipts. These use fixtures and mocked native/network bridges.
- Visual source JavaScript syntax, installer shell syntax, existing root
  manifest and whitespace checks pass.

No screenshot overlay artifacts exist, because there is no authorized actual
capture. No pixel-difference score, measured actual geometry, live compatibility
claim or approved deviation is asserted. Passing tests never changes a row to
PASS.

## Next verification pass

1. Enable Computer Use access to `/Applications/Hermes.app`; use only Settings
   or an empty chat. Keep existing/private chats closed.
2. Restore heavy-job admission (15 GiB free disk required). Build through the
   host wrapper, install only this plugin with its staged installer, then reload.
3. Capture stock and skinned versions at matching dimensions, with capture
   viewport/DPR/zoom recorded. Inspect each original and run Brooklyn's overlay
   utility with explicit, justified crop/density conversion only.
4. Iterate actual layout defects, implement missing native-backed surfaces,
   obtain missing reference states and resolve unsupported feature differences.
5. Exercise native controls, plugin-off restoration and a real updater cycle.
   Commit/push a verified release only when the gate passes.
