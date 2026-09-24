// Grokbot reference: supplied v0.30.0 screenshots, 1040 x 760 source pixels.
// Pixel-derived measurements are provisional until actual Hermes capture.
import { host, PALETTE_AREA, SIDEBAR_NAV_AREA, useQuery } from '@hermes/plugin-sdk'
import { useEffect, useRef } from 'react'
import { jsx } from 'react/jsx-runtime'

const ID = 'grokbot-skin'
const BUILD_ID = '0.1.0'
const RUNTIME_KEY = '__hermesGrokbotSkinRuntime'
const ACTIVE = 'data-grokbot-skin'
const CHAT = 'data-grokbot-chat'
const ROSTER = 'data-grokbot-roster'
const ROW = 'data-grokbot-row'
const SETTINGS = 'data-grokbot-settings'
const OVERLAY = 'data-grokbot-overlay'
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'

const SKIN_CSS = /* css */ `
html[${ACTIVE}] {
  --grokbot-canvas: #fcfcfc;
  --grokbot-sidebar: #f7f7f7;
  --grokbot-card: #f0f0f0;
  --grokbot-incoming: #eee;
  --grokbot-outgoing: #070707;
  --grokbot-text: #171717;
  --grokbot-muted: #737373;
  --grokbot-border: #ddd;
  --grokbot-hover: #ebebeb;
  --grokbot-selected: #e1e1e1;
  --grokbot-color-card: var(--grokbot-canvas);
  --ui-bg: var(--grokbot-canvas);
  --ui-bg-elevated: var(--grokbot-card);
  --ui-chat-surface-background: var(--grokbot-canvas);
  --ui-sidebar-surface-background: var(--grokbot-sidebar);
  --ui-editor-surface-background: var(--grokbot-canvas);
  --ui-text-primary: var(--grokbot-text);
  --ui-text-secondary: var(--grokbot-muted);
  --ui-text-tertiary: var(--grokbot-muted);
  --ui-row-hover-background: var(--grokbot-hover);
  --ui-row-active-background: var(--grokbot-selected);
  --ui-stroke-primary: var(--grokbot-border);
  --ui-stroke-secondary: var(--grokbot-border);
  --dt-background: var(--grokbot-canvas);
  --dt-foreground: var(--grokbot-text);
  --dt-card: var(--grokbot-canvas);
  --dt-card-foreground: var(--grokbot-text);
  --dt-muted: var(--grokbot-card);
  --dt-muted-foreground: var(--grokbot-muted);
  --dt-popover: var(--grokbot-canvas);
  --dt-popover-foreground: var(--grokbot-text);
  --dt-primary: var(--grokbot-outgoing);
  --dt-primary-foreground: var(--grokbot-canvas);
  --dt-secondary: var(--grokbot-card);
  --dt-secondary-foreground: var(--grokbot-text);
  --dt-accent: var(--grokbot-hover);
  --dt-accent-foreground: var(--grokbot-text);
  --dt-border: var(--grokbot-border);
  --dt-input: var(--grokbot-border);
  --dt-composer-ring: #bbb;
  --chrome-action-hover: var(--grokbot-hover);
  color-scheme: light;
  font-family: ${FONT};
}
html[${ACTIVE}] :is(button, input, textarea, select) { font-family: ${FONT}; }
html[${ACTIVE}] [data-tree-group='grp-main'] { background: var(--grokbot-canvas); }
html[${ACTIVE}] [data-tree-group='grp-sessions'] {
  background: var(--grokbot-sidebar);
  border-right: 1px solid var(--grokbot-border);
}
html[${ACTIVE}] [data-tree-split] > div:has(> [data-tree-group='grp-sessions']):not([style*='display: none']) {
  flex: 0 0 280px !important;
  width: 280px !important;
  min-width: 220px;
  max-width: 35vw;
}
html[${ACTIVE}] [data-tree-group] > [data-panel-header] {
  min-height: 52px;
  background: var(--grokbot-canvas);
  border-bottom: 1px solid var(--grokbot-border);
}
html[${ACTIVE}] [data-tree-group='grp-sessions'] > [data-panel-header] { background: var(--grokbot-sidebar); }
html[${ACTIVE}] [${ROSTER}] { background: var(--grokbot-sidebar); font: 13px/18px ${FONT}; }
html[${ACTIVE}] [${ROW}] {
  min-height: 58px;
  padding: 10px 12px;
  gap: 10px;
  border-radius: 8px;
  font: 13px/18px ${FONT};
}
html[${ACTIVE}] [${ROW}] span.font-medium { font-size: 14px; font-weight: 400; }
html[${ACTIVE}] [${ROW}] :is(img, [data-slot='avatar']) { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
html[${ACTIVE}] [${ROW}]:hover { background: var(--grokbot-hover); }
html[${ACTIVE}] [${ROW}][aria-selected='true'] { background: var(--grokbot-selected); }
html[${ACTIVE}] :is([data-hermes-bot-section-header], [data-slot='bots-section-heading']) {
  min-height: 40px;
  padding: 12px 20px 8px;
  color: var(--grokbot-muted);
  font: 12px/18px ${FONT};
  text-transform: none;
  letter-spacing: normal;
  background: transparent;
}
html[${ACTIVE}] [${ROSTER}] > div { padding-inline: 8px; gap: 0; }
html[${ACTIVE}] [${ROSTER}] [data-slot='bots-section-heading'] button { font: inherit; color: inherit; }
html[${ACTIVE}] [data-slot='sidebar-menu-item']:has([data-tour='sidebar-nav-grokbot-settings']),
html[${ACTIVE}] [data-slot='sidebar-menu-item']:has([data-tour='sidebar-nav-grokbot-plugins']) { font: 13px/20px ${FONT}; }
html[${ACTIVE}] [${CHAT}] {
  --composer-width: 100%;
  --composer-shell-pad-block-end: 16px;
  --composer-surface-pad-x: 8px;
  --composer-surface-pad-y: 6px;
  --composer-control-gap: 8px;
  --composer-row-gap: 6px;
  background: var(--grokbot-canvas);
  color: var(--grokbot-text);
  font: 14px/20px ${FONT};
}
html[${ACTIVE}] [${CHAT}] [data-slot='aui_thread-content'] { max-width: none; padding-inline: 16px; }
html[${ACTIVE}] [${CHAT}] [data-slot='aui_user-message-root']:not(:has(textarea, [contenteditable='true'], input)) { align-items: flex-end; }
html[${ACTIVE}] [${CHAT}] .composer-human-message:not(:has(textarea, [contenteditable='true'], input)) {
  width: fit-content; max-width: 88%; margin-left: auto;
  padding: 8px 12px; border: 0; border-radius: 18px 18px 18px 4px;
  background: var(--grokbot-outgoing); color: #fcfcfc; box-shadow: none;
  font: 14px/20px ${FONT};
}
html[${ACTIVE}] [${CHAT}] .composer-human-message:not(:has(textarea, [contenteditable='true'], input))
  :is([data-slot='aui_user-message-text'], [data-slot='aui_user-inline-text']) { color: inherit; }
html[${ACTIVE}] [${CHAT}] [data-slot='aui_assistant-message-content'] > .aui-md {
  width: fit-content; max-width: 88%; padding: 8px 12px; margin-block: 3px;
  background: var(--grokbot-incoming); color: var(--grokbot-text);
  border-radius: 18px 18px 18px 4px; font: 14px/20px ${FONT};
}
html[${ACTIVE}] [${CHAT}] [data-slot='aui_assistant-message-content'] > .aui-md > :is(p, ul, ol) { margin-block: 0; }
/* Rich content and live editing retain native sizing, selection and controls. */
html[${ACTIVE}] [${CHAT}] [data-slot='aui_assistant-message-content'] > .aui-md:has(
  pre, table, [data-slot='code-card'], [data-slot='aui_artifact-card'], [data-slot='aui_embed-card'],
  [data-slot='aui_changed-files'], [data-slot='aui_generated-image'], [data-slot='aui_markdown-alert'],
  [data-streamdown='code-block'], [data-streamdown='mermaid-block'], [data-streamdown='image-wrapper']) {
  max-width: 100%; padding: 0; border-radius: 0; background: transparent;
}
html[${ACTIVE}] [${CHAT}] [data-slot='aui_assistant-message-content'] > .aui-md:empty {
  padding: 0; background: transparent;
}
html[${ACTIVE}] [${CHAT}] [data-slot='composer-dock']:not([data-popped-out]) {
  width: calc(100% - 32px); max-width: none; padding-bottom: 16px;
}
html[${ACTIVE}] [${CHAT}] [data-slot='composer-root'] { border-radius: 24px; background: transparent; }
html[${ACTIVE}] [${CHAT}] [data-slot='composer-surface'] {
  min-height: 44px; border: 1px solid #bbb; border-radius: 24px;
  background: var(--grokbot-canvas); box-shadow: 0 2px 5px #0000000d;
}
html[${ACTIVE}] [${CHAT}] [data-slot='composer-surface'] > [aria-hidden] { background: transparent; }
html[${ACTIVE}] [${CHAT}] [data-slot='composer-fade'] { padding: 6px 8px; opacity: 1; }
html[${ACTIVE}] [${CHAT}] [data-slot='composer-rich-input'] {
  min-height: 28px; padding-block: 4px; font: 14px/20px ${FONT};
}
html[${ACTIVE}] [${CHAT}] [data-slot='composer-fade'] > div:has(> div > [data-slot='composer-rich-input']) {
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: 'menu input controls'; align-items: center;
}
html[${ACTIVE}] [${CHAT}] [data-slot='composer-surface'] button:is([aria-label='Send'], [aria-label='Voice dictation']) {
  width: 28px; height: 28px; border-radius: 50%; background: #070707; color: #fcfcfc;
}
html[${ACTIVE}] [${CHAT}] [data-slot='composer-surface'] button[aria-label='Add context'] {
  width: 28px; height: 28px; border-radius: 50%; background: var(--grokbot-card); color: var(--grokbot-muted);
}
/* A skin cannot replace the native model, thinking, queue or approval logic. */
html[${ACTIVE}] [${CHAT}] :is([data-slot='tool-approval-stack'], [data-approval-stack], [data-slot='tool-approval-actions']) {
  color: var(--grokbot-text);
}
html[${ACTIVE}] [data-hermes-task-dock] { border-radius: 16px; background: var(--grokbot-card); color: var(--grokbot-text); }
html[${ACTIVE}] [${CHAT}] [data-slot='aui_response-loading'] {
  width: fit-content; min-width: 46px; min-height: 30px; padding: 6px 12px;
  border-radius: 16px; background: var(--grokbot-incoming); color: var(--grokbot-muted);
}
html[${ACTIVE}] [${OVERLAY}] { padding: 0; background: rgb(0 0 0 / .5); backdrop-filter: none; }
html[${ACTIVE}] [${SETTINGS}] {
  position: absolute; inset: 0; margin: auto;
  width: min(1000px, calc(100vw - 40px)); max-width: none;
  height: min(656px, calc(100vh - 104px)); max-height: calc(100vh - 40px);
  border: 1px solid var(--grokbot-border); border-radius: 16px;
  background: var(--grokbot-canvas); color: var(--grokbot-text);
  font: 13px/20px ${FONT}; overflow: hidden;
}
html[${ACTIVE}] [${SETTINGS}] div:has(> aside[data-tour='overlay-nav']) { grid-template-columns: 198px minmax(0, 1fr); }
html[${ACTIVE}] [${SETTINGS}] aside[data-tour='overlay-nav'] { padding: 16px 12px; border-right: 1px solid var(--grokbot-border); background: var(--grokbot-sidebar); }
html[${ACTIVE}] [${SETTINGS}] aside[data-tour='overlay-nav'] button { min-height: 30px; font: 13px/20px ${FONT}; border: 0; border-radius: 8px; }
html[${ACTIVE}] [${SETTINGS}] aside[data-tour='overlay-nav'] button[aria-current='page'] { background: var(--grokbot-selected); }
html[${ACTIVE}] [${SETTINGS}] main { padding: 32px; max-width: none; }
html[${ACTIVE}] [${SETTINGS}] [id^='setting-field-'] { padding: 12px 14px; border-radius: 16px; background: var(--grokbot-card); }
html[${ACTIVE}] [data-slot='dialog-overlay'] { background: rgb(0 0 0 / .5); backdrop-filter: none; }
html[${ACTIVE}] :is([data-slot='dropdown-menu-content'], [data-slot='context-menu-content'], [data-slot='popover-content']) {
  border: 1px solid var(--grokbot-border); border-radius: 14px;
  background: var(--grokbot-canvas); color: var(--grokbot-text);
  box-shadow: 0 8px 20px #00000014, 0 2px 4px #00000008; font: 13px/20px ${FONT};
}
html[${ACTIVE}] :is([data-slot='dropdown-menu-item'], [data-slot='context-menu-item']) { min-height: 32px; border-radius: 8px; }
html[${ACTIVE}] :is([data-slot='dropdown-menu-item'], [data-slot='context-menu-item'])[data-highlighted] { background: var(--grokbot-hover); }
@media (max-width: 760px) {
  html[${ACTIVE}] [data-tree-split] > div:has(> [data-tree-group='grp-sessions']):not([style*='display: none']) { flex-basis: 220px !important; width: 220px !important; min-width: 0; }
  html[${ACTIVE}] [${CHAT}] [data-slot='composer-fade'] > div:has(> div > [data-slot='composer-rich-input']) {
    grid-template-columns: auto minmax(0, 1fr); grid-template-areas: 'input input' 'menu controls';
  }
  html[${ACTIVE}] [${OVERLAY}] { padding: 0; background: rgb(0 0 0 / .5); backdrop-filter: none; }
html[${ACTIVE}] [${SETTINGS}] {
  position: absolute; inset: 0; margin: auto; width: calc(100vw - 24px); height: calc(100vh - 48px); }
}
`

function visible(node) {
  return !node.closest('[data-pane-hidden], [hidden], [inert]')
}

// Mark only a complete, known native structure. Never read transcript text.
function findSurfaces(doc) {
  const main = [...doc.querySelectorAll('[data-tree-group="grp-main"]')].find(visible)
  const sidebar = [...doc.querySelectorAll('[data-tree-group="grp-sessions"]')].find(visible)
  if (!main || !sidebar) return null
  const chats = [...main.querySelectorAll('[data-chat-surface]')].filter(node => visible(node)
    && node.querySelector('[data-slot="aui_thread-viewport"]')
    && node.querySelector('[data-slot="composer-surface"] [data-slot="composer-rich-input"]'))
  const overlays = [...doc.querySelectorAll('[data-overlay-surface]')].filter(node => visible(node)
    && node.querySelector('[data-glass-raised] aside[data-tour="overlay-nav"]')
    && node.querySelector('[data-glass-raised] main'))
  const rosters = [...sidebar.querySelectorAll('[data-slot="bots-roster"]')].filter(visible)
  if (!chats.length && !overlays.length && !rosters.length) return null
  return { main, sidebar, chats, overlays, rosters }
}

function createSkinRuntime(ctx, doc = document) {
  const token = `${ID}-${Math.random().toString(36).slice(2)}`
  const owned = new Map()
  let style = null, observer = null, frame = 0, disposed = false
  let enabled = false, revision = 0
  const restore = (node, attrs) => {
    for (const [name, previous] of attrs) {
      if (node.getAttribute(name) !== token) continue
      if (previous === null) node.removeAttribute(name)
      else node.setAttribute(name, previous)
    }
  }
  const clear = () => {
    for (const [node, attrs] of owned) restore(node, attrs)
    owned.clear()
    style?.remove(); style = null
  }
  const mark = (next, node, name) => {
    if (!node) return
    let attrs = next.get(node)
    if (!attrs) { attrs = new Set(); next.set(node, attrs) }
    attrs.add(name)
    let previous = owned.get(node)
    if (!previous) { previous = new Map(); owned.set(node, previous) }
    if (!previous.has(name)) previous.set(name, node.getAttribute(name))
    if (node.getAttribute(name) !== token) node.setAttribute(name, token)
  }
  const sync = () => {
    if (disposed) return
    try {
      const surfaces = enabled && findSurfaces(doc)
      if (!surfaces) { clear(); return }
      const next = new Map()
      mark(next, doc.documentElement, ACTIVE)
      for (const chat of surfaces.chats) mark(next, chat, CHAT)
      for (const roster of surfaces.rosters) {
        mark(next, roster, ROSTER)
        for (const row of roster.querySelectorAll('[data-roster-key]')) {
          if (visible(row)) mark(next, row, ROW)
        }
      }
      const route = globalThis.window?.location?.hash || ''
      if (/^#\/(settings|capabilities)(?:\?|$)/.test(route)) {
        for (const overlay of surfaces.overlays) {
          mark(next, overlay, OVERLAY)
          mark(next, overlay.querySelector('[data-glass-raised]'), SETTINGS)
        }
      }
      for (const [node, attrs] of owned) {
        for (const [name, previous] of attrs) {
          if (next.get(node)?.has(name)) continue
          restore(node, new Map([[name, previous]])); attrs.delete(name)
        }
        if (!attrs.size) owned.delete(node)
      }
      if (!style) {
        style = doc.createElement('style')
        style.dataset.grokbotOwned = token
        style.textContent = SKIN_CSS + UPDATE_CSS
        doc.head.appendChild(style)
      }
    } catch {
      // Hook changes or unsupported DOM shapes restore native presentation.
      clear()
    }
  }
  const schedule = () => {
    if (!disposed && !frame) frame = requestAnimationFrame(() => { frame = 0; sync() })
  }
  const runtime = {
    start() {
      observer = new MutationObserver(schedule)
      observer.observe(doc.documentElement, { subtree: true, childList: true, attributes: true,
        attributeFilter: ['data-pane-hidden', 'data-pane-host', 'data-slot', 'data-tree-group', 'data-chat-surface',
          'data-overlay-surface', 'data-glass-raised', 'data-tour', 'data-roster-key', 'hidden', 'inert'] })
      globalThis.window?.addEventListener('hashchange', schedule)
      const readRevision = revision
      try {
        const value = ctx.storage.get('enabled', true)
        if (value && typeof value.then === 'function') {
          value.then(resolved => {
            if (!disposed && revision === readRevision) { enabled = resolved !== false; schedule() }
          }).catch(() => {})
        } else enabled = value !== false
      } catch { /* storage unavailable: stay stock until explicitly toggled */ }
      sync()
    },
    toggle() {
      enabled = !enabled; revision++
      try { Promise.resolve(ctx.storage.set('enabled', enabled)).catch(() => {}) } catch { /* session-only setting */ }
      sync()
    },
    isEnabled: () => enabled,
    dispose() {
      if (disposed) return
      disposed = true; observer?.disconnect()
      globalThis.window?.removeEventListener('hashchange', schedule)
      if (frame) cancelAnimationFrame(frame)
      frame = 0; clear()
      if (globalThis[RUNTIME_KEY] === runtime) delete globalThis[RUNTIME_KEY]
    }
  }
  return runtime
}

export default {
  id: ID,
  name: 'Grokbot Skin',
  description: 'Grokbot layout for Hermes. Development preview; visual parity is not yet verified.',
  defaultEnabled: true,
  register(ctx) {
    // Without disposal and contributions there is no safe plugin contract.
    if (!ctx?.onDispose || !ctx?.register || !globalThis.document?.body) return
    globalThis[RUNTIME_KEY]?.dispose()
    const runtime = createSkinRuntime(ctx)
    globalThis[RUNTIME_KEY] = runtime
    ctx.onDispose(() => runtime.dispose())
    const updater = createSkinUpdater(ctx.storage)
    ctx.onDispose(() => updater.dispose())
    ctx.register({ id: 'update-runtime', area: 'composer.leading', order: 19,
      render: () => jsx(GrokbotUpdateRuntime, { updater }) })
    ctx.register({ id: 'update-button', area: 'composer.leading', order: 20,
      render: () => jsx(GrokbotUpdateButton, { updater }) })
    ctx.register({ id: 'toggle', area: PALETTE_AREA, data: {
      id: `${ID}.toggle`, label: 'Grokbot Skin: toggle', keywords: ['grokbot', 'skin', 'appearance'],
      detail: () => runtime.isEnabled() ? 'on' : 'off', detailVariant: 'state', keepOpen: true,
      run: () => runtime.toggle()
    } })
    if (typeof host?.navigate === 'function') {
      ctx.register({ id: 'grokbot-settings', area: SIDEBAR_NAV_AREA, data: {
        path: '/settings?tab=config:appearance&page=general', label: 'Settings', codicon: 'settings-gear'
      } })
      ctx.register({ id: 'grokbot-plugins', area: SIDEBAR_NAV_AREA, data: {
        path: '/capabilities?tab=plugins', label: 'Plugins', codicon: 'plug'
      } })
    }
    runtime.start()
  }
}
