# Visual verification ledger

Status as of 2026-09-23: **BLOCKED — zero reference captures, zero actual skin
captures, zero passed screens.** The required Brooklyn `visual-verify` instructions
have been read; its actual-app comparison loop cannot run yet.

Reference Grokbot was not resolved by Computer Use and was absent from the
discovered app list and standard Applications folders. Thomas has been asked
for the location. A broad Hermes capture was rejected by automatic approval
review for private-chat exposure. A narrowed navigation request subsequently
reported that Computer Use was not approved for Hermes. Access and a safe
empty/settings surface have been requested; no alternate capture path was used.

| Screen or state | Copied from Grokbot | Actual-app evidence | Status |
| --- | --- | --- | --- |
| Sidebar / bot roster / sections | Nothing yet | None | BLOCKED |
| Expanded, collapsed and selected rows | Nothing yet | None | BLOCKED |
| Empty chat | Nothing yet | None | BLOCKED |
| Populated chat / bubbles / long messages | Nothing yet | None | BLOCKED |
| Composer: empty, multiline, attachment | Nothing yet | None | BLOCKED |
| Typing, loading and disabled states | Nothing yet | None | BLOCKED |
| Task Dock | Nothing yet | None | BLOCKED |
| Model menu | Nothing yet | None | BLOCKED |
| Thinking Level menu | Nothing yet | None | BLOCKED |
| Queue | Nothing yet | None | BLOCKED |
| Approval controls | Nothing yet | None | BLOCKED |
| Context menus / command palette | Nothing yet | None | BLOCKED |
| Settings / dialogs / errors | Nothing yet | None | BLOCKED |
| Sessions and split panes | Nothing yet | None | BLOCKED |
| Update notification / notes / install / recovery | Infrastructure only | None | BLOCKED |
| Plugin off / native restoration | Nothing installed | None | BLOCKED |

Expand this inventory from the actual Grokbot walkthrough; it is not evidence
that the list covers every screen. Any Hermes-only controls should retain their
native behavior and be explicitly distinguished from matched reference states.

For each subsequent iteration record: reference and actual app versions, commit,
state, safe fixture, viewport, DPR, zoom, root font, capture paths, crop/scale
contract, computed styles/rectangles, overlay/report paths, reviewed deltas,
remaining defects and any user-accepted deviations. Preserve original captures.

No deviations have been approved. Unit tests or fixture renders must never
change this ledger to PASS.
