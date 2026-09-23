---
name: electron-copy
description: Capture a running Electron app as a measured UI reference, implement its layout in a desktop plugin, and verify each state against real screenshots.
---

# Copy an Electron interface

Use the running source app as the design authority. Load Brooklyn's `ui-only`,
`ui-system`, and `visual-verify` skills, including `visual-verify`'s screenshot
overlay instructions. Missing app access blocks visual implementation and parity;
it does not justify an invented theme or a synthetic replacement app.

## Attach and establish scope

1. Read project instructions and identify the reference app, destination app,
   exact versions, plugin hook contract, and authorized scope.
2. Open the reference through the available Computer Use skill. Resolve an
   ambiguous bundle identifier with the exact installed app path.
3. Prefer an existing, authorized, loopback CDP endpoint for DOM measurements.
   Do not quit an active app or relaunch it with debugging enabled without
   resolving the impact on ongoing work. A fresh Electron instance must use an
   isolated user-data directory; never launch two writers on the same profile.
   If CDP is unavailable, retain screenshot evidence and label DOM measurements
   unavailable. Do not claim that screenshot guesses are computed styles.
4. Use the host's required heavy-job admission wrapper for unattended browser
   or Electron jobs. Record the job receipt and exact owned process; never
   terminate unrelated app processes.
5. A denied app capture cannot be bypassed through CDP, another screenshot API,
   or indirect execution. Resolve access first. Use empty chats and harmless
   fixture data. Never submit test prompts to a paid model without authorization.

## Capture a reference packet

Enumerate states before implementing: roster/sidebar (expanded, collapsed,
selected and context menu), empty chat, populated chat, long and edited messages,
composer (empty, multiline, attachment and disabled), typing/loading, tasks,
model menu, reasoning menu, queue, approvals, command palette, settings, dialogs,
errors, and any additional screen found during the walkthrough. Record states
that exist only in the destination as native-behavior checks, not pixel matches.

For each state store an immutable packet in a private artifact directory:

- Clean original PNG, app version, capture timestamp, route/state, theme,
  language, scroll, fixture description, and capture method.
- CSS viewport width/height, DPR, browser zoom, `visualViewport.scale`, root
  font size and client/scrollbar width. Record unavailable fields explicitly.
- Scoped DOM structure with user-authored text, field values, URLs and private
  identifiers omitted. Never dump the entire app document or chat history.
- For approved UI selectors: bounding rectangle; display/grid/flex/order;
  font family/size/weight/line-height; foreground/background/border colors;
  padding/gaps/margins; radii and shadow. Store selector counts as hook evidence.
- Safe click path to reproduce the state. Transient states need a repeatable
  trigger. Do not manufacture a loading state and describe it as production.

Keep raw screenshots, DOM packets and user data out of public git history.
Publish sanitized fixture screenshots only after visually checking the pixels.

## Implement the plugin

Derive tokens and layout from the packet. Prefer the destination's official SDK
slots and native controls. Do not reparent React-owned nodes; preserve their
identity, event handlers, accessibility, and framework lifecycle. CSS grid/flex
can restructure layout without changing ownership. Any added nodes belong to
the plugin and must be removed on disposal.

Gate styles and behavior on verified hooks. If the required hook set disappears,
remove plugin markers and restore native rendering. Unknown states stay native.
Keep a cleanup ledger for styles, attributes, subscriptions, observers, timers,
and added nodes. Never persist native theme/layout changes merely to style a
plugin. Verify rapid toggles, route changes, hot reload and split panes.

## Compare the actual surface

1. Run the installed plugin in the real destination app, in matching viewport,
   theme, content, scroll and state. A DOM fixture is a unit-test tool only.
2. Capture clean actual screenshots and the same measured UI selectors.
3. Use Brooklyn's `visual-verify/scripts/compare.py` to make side-by-side,
   blend, inverted and difference artifacts. Use explicit crop coordinates
   and verified density conversion only. Never stretch or auto-align screenshots
   to hide placement errors.
4. Inspect both clean captures and overlays. Record measured layout/typography/
   color differences and correct them. A low global pixel difference is not a
   pass threshold; missing controls can occupy very few pixels.
5. Re-capture changed states plus affected neighbors. Keep visual status,
   functional status and user approval distinct in the evidence ledger.
6. Compare plugin-off captures with the original native baseline at identical
   state; verify controls, focus and interactions as well as pixels.

Mark a state PASS only with actual-app capture paths, comparison artifacts,
reviewed deltas and explicit explanations for accepted deviations. BLOCKED,
UNREVIEWED and FAIL are valid results. Never summarize those as completion.
