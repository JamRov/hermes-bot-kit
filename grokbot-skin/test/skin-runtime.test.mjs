import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../src/skin.js', import.meta.url), 'utf8')

// A bounded native-DOM fixture. It dispatches the observer's actual attribute
// filter, so removing a hook cannot be made to pass by manually calling sync().
class Element {
 constructor(tag, attrs = {}, document) { this.tagName = tag.toUpperCase(); this.attrs = new Map(Object.entries(attrs)); this.children = []; this.parentElement = null; this.ownerDocument = document; this.dataset = {}; this.style = {} }
 getAttribute(name) { return this.attrs.get(name) ?? null }
 hasAttribute(name) { return this.attrs.has(name) }
 setAttribute(name, value) { this.attrs.set(name, String(value)); this.ownerDocument.notify(this, 'attributes', name) }
 removeAttribute(name) { this.attrs.delete(name); this.ownerDocument.notify(this, 'attributes', name) }
 appendChild(node) { if (node.parentElement) node.remove(); node.parentElement = this; this.children.push(node); this.ownerDocument.notify(this, 'childList'); return node }
 remove() { if (!this.parentElement) return; const parent = this.parentElement; parent.children.splice(parent.children.indexOf(this), 1); this.parentElement = null; this.ownerDocument.notify(parent, 'childList') }
 contains(node) { for (; node; node = node.parentElement) if (node === this) return true; return false }
 matches(selector) {
  return selector.split(',').some(branch => {
   const parts = branch.trim().match(/(?:\[[^\]]*\]|[^\s\[])+/g) || []
   let node = this
   for (let i = parts.length - 1; i >= 0; i--) {
    if (i === parts.length - 1) { if (!node.simpleMatch(parts[i])) return false }
    else { do { node = node.parentElement } while (node && !node.simpleMatch(parts[i])); if (!node) return false }
   }
   return parts.length > 0
  })
 }
 simpleMatch(selector) {
  const tag = /^[\w-]+/.exec(selector)?.[0]
  if (tag && this.tagName.toLowerCase() !== tag.toLowerCase()) return false
  for (const [, name, , value] of selector.matchAll(/\[([^=\]\s]+)(?:=(['"]?)(.*?)\2)?\]/g)) {
   if (!this.hasAttribute(name) || (value !== undefined && this.getAttribute(name) !== value)) return false
  }
  for (const [, name] of selector.matchAll(/\.([\w-]+)/g)) if (!(this.getAttribute('class') || '').split(/\s+/).includes(name)) return false
  return true
 }
 closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null }
 querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]) }
 querySelector(selector) { return this.querySelectorAll(selector)[0] || null }
 get textContent() { if (this.tagName !== 'STYLE') throw new Error('Native text must not be read by the lifecycle fixture'); return this.text || '' }
 set textContent(value) { if (this.tagName !== 'STYLE') throw new Error('Native text must not be replaced'); this.text = value }
}

function fixture({ storageGet = () => true } = {}) {
 const observers = new Set(), frames = new Map(), writes = [], updaterDisposals = [], listeners = new Map()
 let nextFrame = 0
 const document = {
  notify(node, type, name) { for (const observer of observers) if (observer.root?.contains(node) && observer.options[type] && (type !== 'attributes' || !observer.options.attributeFilter || observer.options.attributeFilter.includes(name))) observer.callback([{ type, target: node, attributeName: name }]) },
  createElement: tag => new Element(tag, {}, document),
  querySelectorAll(selector) { return this.documentElement.querySelectorAll(selector) },
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null }
 }
 const node = (tag, attrs = {}, parent = document.body) => parent.appendChild(new Element(tag, attrs, document))
 document.documentElement = new Element('html', {}, document)
 document.head = node('head', {}, document.documentElement)
 document.body = node('body', {}, document.documentElement)
 const main = node('section', { 'data-tree-group': 'grp-main' })
 const sidebar = node('aside', { 'data-tree-group': 'grp-sessions' })
 const chat = node('div', { 'data-chat-surface': '' }, main)
 const viewport = node('div', { 'data-slot': 'aui_thread-viewport' }, chat)
 const composer = node('div', { 'data-slot': 'composer-surface' }, chat)
 const input = node('div', { 'data-slot': 'composer-rich-input' }, composer)
 const roster = node('div', { 'data-slot': 'bots-roster' }, sidebar)
 const row = node('button', { 'data-roster-key': 'example', 'data-slot': 'row-button', 'aria-label': 'Example · @example' }, roster)
 const otherRow = node('button', { 'data-slot': 'row-button', 'aria-label': 'Settings' }, roster)
 const window = { location: { hash: '#/' }, addEventListener(name, callback) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback) }, removeEventListener(name, callback) { listeners.get(name)?.delete(callback) } }
 const context = vm.createContext({ document, window, console,
  host: {}, PALETTE_AREA: 'palette', SIDEBAR_NAV_AREA: 'sidebar.nav', useQuery() {}, useEffect() {}, useRef() {}, jsx() {}, UPDATE_CSS: '',
  createSkinUpdater: () => ({ dispose() { updaterDisposals.push(true) } }),
  requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame },
  cancelAnimationFrame(id) { frames.delete(id) },
  MutationObserver: class {
   constructor(callback) { this.callback = callback }
   observe(root, options) { this.root = root; this.options = options; observers.add(this) }
   disconnect() { observers.delete(this); this.root = null }
  }
 })
 vm.runInContext(source.replace(/^import .*$/gm, '').replace('export default {', 'globalThis.plugin = {') + '\nglobalThis.hooks = {createSkinRuntime, findSurfaces, ACTIVE, CHAT, ROSTER, ROW, SETTINGS, OVERLAY, RUNTIME_KEY};', context)
 const disposers = [], contributions = []
 const ctx = { storage: { get: storageGet, set: (key, value) => writes.push([key, value]) }, onDispose: fn => disposers.push(fn), register: item => contributions.push(item) }
 const flush = () => { for (let turn = 0; frames.size; turn++) { assert.ok(turn < 20, 'observer updates must settle'); const callbacks = [...frames.values()]; frames.clear(); for (const callback of callbacks) callback() } }
 return { document, window, listeners, node, main, sidebar, chat, viewport, composer, input, roster, row, otherRow, frames, observers, writes, context, ctx, disposers, contributions, updaterDisposals, flush, ...context.hooks }
}

function start(t, options) {
 const f = fixture(options)
 f.runtime = f.createSkinRuntime(f.ctx, f.document)
 t.after(() => f.runtime.dispose())
 f.runtime.start(); f.flush()
 return f
}

test('known native hooks activate, then a removed layout hook restores native presentation', t => {
 const f = start(t)
 assert.ok(f.document.documentElement.hasAttribute(f.ACTIVE))
 assert.ok(f.chat.hasAttribute(f.CHAT)); assert.ok(f.row.hasAttribute(f.ROW))
 assert.equal(f.otherRow.hasAttribute(f.ROW), false)
 assert.equal(f.document.head.children.length, 1)
 f.main.removeAttribute('data-tree-group'); f.flush()
 assert.equal(f.document.documentElement.hasAttribute(f.ACTIVE), false)
 assert.equal(f.chat.hasAttribute(f.CHAT), false); assert.equal(f.row.hasAttribute(f.ROW), false)
 assert.equal(f.document.head.children.length, 0)
 f.main.setAttribute('data-tree-group', 'grp-main'); f.flush()
 assert.ok(f.chat.hasAttribute(f.CHAT))
})

test('hidden, inert and hidden-pane ancestors never receive active chat markers', t => {
 const f = start(t)
 for (const attribute of ['data-pane-hidden', 'hidden', 'inert']) {
  const parent = f.node('div', { [attribute]: '' }, f.main)
  const chat = f.node('div', { 'data-chat-surface': '' }, parent)
  f.node('div', { 'data-slot': 'aui_thread-viewport' }, chat)
  const composer = f.node('div', { 'data-slot': 'composer-surface' }, chat)
  f.node('div', { 'data-slot': 'composer-rich-input' }, composer)
  f.flush(); assert.equal(chat.hasAttribute(f.CHAT), false, attribute)
  parent.removeAttribute(attribute); f.flush(); assert.ok(chat.hasAttribute(f.CHAT), `${attribute} becomes visible`)
  parent.setAttribute(attribute, ''); f.flush(); assert.equal(chat.hasAttribute(f.CHAT), false, `${attribute} becomes hidden`)
 }
 assert.ok(f.chat.hasAttribute(f.CHAT), 'visible native chat stays marked')
})

test('removing the chat surface hook alone drops its owned marker', t => {
 const f = start(t)
 f.chat.removeAttribute('data-chat-surface'); f.flush()
 assert.equal(f.chat.hasAttribute(f.CHAT), false)
})

test('removing a composer hook makes only that chat fall back', t => {
 const f = start(t)
 f.input.removeAttribute('data-slot'); f.flush()
 assert.equal(f.chat.hasAttribute(f.CHAT), false)
 f.input.setAttribute('data-slot', 'composer-rich-input'); f.flush()
 assert.ok(f.chat.hasAttribute(f.CHAT))
})

test('an unknown page with layout chrome but no recognized surface stays stock', t => {
 const f = start(t)
 f.chat.remove(); f.roster.remove(); f.flush()
 assert.equal(f.findSurfaces(f.document), null)
 assert.equal(f.document.documentElement.hasAttribute(f.ACTIVE), false)
 assert.equal(f.document.head.children.length, 0)
})

test('roster rows within a hidden subtree are never marked', t => {
 const f = start(t), hiddenGroup = f.node('div', { hidden: '' }, f.roster)
 const hiddenRow = f.node('button', { 'data-roster-key': 'hidden-bot' }, hiddenGroup)
 f.flush(); assert.equal(hiddenRow.hasAttribute(f.ROW), false)
 hiddenGroup.removeAttribute('hidden'); f.flush(); assert.ok(hiddenRow.hasAttribute(f.ROW))
 hiddenRow.removeAttribute('data-roster-key'); f.flush(); assert.equal(hiddenRow.hasAttribute(f.ROW), false)
})

test('a stored disabled setting never flashes the skin during startup', async t => {
 const f = start(t, { storageGet: () => false })
 assert.equal(f.document.documentElement.hasAttribute(f.ACTIVE), false, 'disabled before the storage microtask runs')
 assert.equal(f.document.head.children.length, 0)
 await Promise.resolve(); f.flush()
 assert.equal(f.runtime.isEnabled(), false)
 assert.equal(f.document.documentElement.hasAttribute(f.ACTIVE), false)
})

test('visible chat shapes outside the selected main pane remain native', t => {
 const f = start(t), foreign = f.node('div', { 'data-chat-surface': '' })
 f.node('div', { 'data-slot': 'aui_thread-viewport' }, foreign)
 const composer = f.node('div', { 'data-slot': 'composer-surface' }, foreign)
 f.node('div', { 'data-slot': 'composer-rich-input' }, composer)
 f.flush()
 assert.equal(foreign.hasAttribute(f.CHAT), false)
 assert.ok(f.chat.hasAttribute(f.CHAT))
})

test('settings overlays require native structure and route, and drop markers after hook removal', t => {
 const f = start(t), overlay = f.node('div', { 'data-overlay-surface': '' })
 const card = f.node('div', { 'data-glass-raised': '' }, overlay)
 const nav = f.node('aside', { 'data-tour': 'overlay-nav' }, card)
 f.node('main', {}, card)
 f.window.location.hash = '#/settings?tab=general'
 for (const callback of f.listeners.get('hashchange') || []) callback()
 f.flush()
 assert.ok(overlay.hasAttribute(f.OVERLAY)); assert.ok(card.hasAttribute(f.SETTINGS))
 nav.removeAttribute('data-tour'); f.flush()
 assert.equal(overlay.hasAttribute(f.OVERLAY), false); assert.equal(card.hasAttribute(f.SETTINGS), false)
 nav.setAttribute('data-tour', 'overlay-nav'); f.flush()
 assert.ok(card.hasAttribute(f.SETTINGS))
 f.window.location.hash = '#/another-screen'
 for (const callback of f.listeners.get('hashchange') || []) callback()
 f.flush()
 assert.equal(card.hasAttribute(f.SETTINGS), false)
 f.runtime.dispose()
 assert.equal(f.listeners.get('hashchange').size, 0)
})

test('stale enabled storage read cannot undo a newer toggle', async t => {
 let resolve
 const pending = new Promise(done => { resolve = done })
 const f = start(t, { storageGet: () => pending })
 assert.equal(f.runtime.isEnabled(), false)
 assert.equal(f.document.documentElement.hasAttribute(f.ACTIVE), false)
 f.runtime.toggle(); assert.equal(f.runtime.isEnabled(), true)
 resolve(false); await pending; await Promise.resolve(); f.flush()
 assert.equal(f.runtime.isEnabled(), true)
 assert.ok(f.document.documentElement.hasAttribute(f.ACTIVE))
 assert.deepEqual(f.writes, [['enabled', true]])
})

test('late enabled read after disposal cannot schedule work or restore markers', async t => {
 let resolve
 const pending = new Promise(done => { resolve = done })
 const f = start(t, { storageGet: () => pending })
 f.runtime.dispose(); resolve(true); await pending; await Promise.resolve()
 assert.equal(f.frames.size, 0); assert.equal(f.observers.size, 0)
 assert.equal(f.document.head.children.length, 0)
 assert.equal(f.document.documentElement.hasAttribute(f.ACTIVE), false)
})

test('disposal restores original attributes exactly and preserves intervening external ownership', t => {
 const f = fixture()
 const originals = [[f.document.documentElement, f.ACTIVE, 'previous-root'], [f.chat, f.CHAT, ''], [f.roster, f.ROSTER, 'previous-roster']]
 for (const [node, name, value] of originals) node.setAttribute(name, value)
 const runtime = f.createSkinRuntime(f.ctx, f.document); t.after(() => runtime.dispose())
 runtime.start(); f.flush()
 f.row.setAttribute(f.ROW, 'another-plugin')
 runtime.dispose(); runtime.dispose()
 for (const [node, name, value] of originals) assert.equal(node.getAttribute(name), value)
 assert.equal(f.row.getAttribute(f.ROW), 'another-plugin')
 assert.equal(f.document.head.children.length, 0)
 assert.equal(f.frames.size, 0); assert.equal(f.observers.size, 0)
})

test('a DOM exception removes owned presentation without changing native hierarchy', t => {
 const f = start(t), parent = f.chat.parentElement, children = [...f.chat.children]
 f.sidebar.querySelectorAll = () => { throw new Error('hook shape changed') }
 f.sidebar.setAttribute('data-tree-group', 'grp-sessions'); f.flush()
 assert.equal(f.document.head.children.length, 0)
 assert.equal(f.document.documentElement.hasAttribute(f.ACTIVE), false)
 assert.equal(f.chat.hasAttribute(f.CHAT), false)
 assert.equal(f.chat.parentElement, parent); assert.deepEqual(f.chat.children, children)
})

test('hot reload disposes the previous runtime and stale cleanup preserves the new owner', t => {
 const f = fixture()
 t.after(() => f.disposers.forEach(dispose => dispose()))
 f.context.plugin.register(f.ctx); f.flush()
 const oldRuntime = f.context[f.RUNTIME_KEY], oldDisposers = [...f.disposers]
 const previousToken = f.document.documentElement.getAttribute(f.ACTIVE)
 f.context.plugin.register(f.ctx); f.flush()
 const nextRuntime = f.context[f.RUNTIME_KEY], nextToken = f.document.documentElement.getAttribute(f.ACTIVE)
 assert.notEqual(nextRuntime, oldRuntime); assert.notEqual(nextToken, previousToken)
 assert.equal(f.observers.size, 1); assert.equal(f.document.head.children.length, 1)
 oldDisposers.forEach(dispose => dispose())
 assert.equal(f.context[f.RUNTIME_KEY], nextRuntime)
 assert.equal(f.document.documentElement.getAttribute(f.ACTIVE), nextToken)
 assert.equal(f.observers.size, 1); assert.equal(f.document.head.children.length, 1)
 f.disposers.forEach(dispose => dispose())
 assert.equal(f.context[f.RUNTIME_KEY], undefined)
 assert.equal(f.observers.size, 0); assert.equal(f.document.head.children.length, 0)
})
