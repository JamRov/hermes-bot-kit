# Grokbot reference packet

Design authority: six user-supplied captures from signed-in Grokbot v0.30.0,
received 2026-09-23. Originals remain outside git in
`../reference-screens/` relative to the handoff workspace. They contain private
content and must not be published as demonstration images.

All originals are **1040 × 760 raster pixels**. Source DPR, viewport CSS size,
browser zoom, root font size, DOM rectangles, computed font and style values
are unavailable. Coordinates below are raster measurements, not verified CSS
measurements. The implementation provisionally assumes 1 raster pixel per CSS
pixel. An actual matched-size capture must validate that assumption; never
stretch a Hermes screenshot to manufacture alignment.

| Reference | Visible design |
| --- | --- |
| `01-main-chat.png` | Roster, named sections, conversation, outgoing and incoming bubbles, composer |
| `02-account-menu.png` | Rounded account popover above sidebar footer |
| `03-settings-general.png` | Centered Settings dialog, left navigation, grouped General controls |
| `04-settings-computer.png` | Same dialog with Computer/egress panel |
| `05-new-chat.png` | Top recipient picker with search, avatars and keyboard hint footer; empty conversation |
| `06-plugins.png` | Search, category chips and two-column featured plugin catalog |

## Measured tokens and geometry

Dominant fills were sampled with Pillow from the original PNG pixels:

- Chat/dialog canvas: `#fcfcfc`.
- Roster/settings rail: `#f7f7f7`.
- Incoming bubbles: `#eeeeee`; outgoing bubble: `#070707`.
- Settings cards: `#f0f0f0`; selected navigation: `#e1e1e1`.
- Roster ends at x=280; chat header ends at y=52.
- Composer bounds are approximately x=296, y=700, width=728, height=44.
- Settings dialog bounds: x=20, y=52, width=1000, height=656.
- Settings rail ends at x=218, giving a 198-pixel rail within the dialog.
- Settings content begins near x=251; title starts near x=259.
- Recipient picker bounds: approximately x=314, y=43, width=560, height=395.

Typography, radii and minor gaps in source are estimates from these pixels.
Platform font differences remain unverified. These measurements guide the
candidate; they do not establish visual parity.

## Missing reference states

No reference captures yet for collapsed sections, hover/focus states, long or
edited messages, multiline/attachment composer, typing/loading, Task Dock,
model/Thinking menus, Queue, approvals, command palette, errors, split panes,
or update notification/recovery. Hermes-only functions need functional checks;
Grokbot visual states need corresponding references before a parity judgment.
