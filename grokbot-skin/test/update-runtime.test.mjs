import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash, webcrypto } from 'node:crypto'
import vm from 'node:vm'
import test from 'node:test'
const runtime = await readFile(new URL('../src/update-runtime.js', import.meta.url), 'utf8')
const repo = 'thomasbek3/hermes-bot-kit'
const root = '/local/desktop-plugins', target = `${root}/grokbot-skin/plugin.js`
const a = "const ID = 'grokbot-skin'\nconst BUILD_ID = '0.1.0'\n"
const b = "const ID = 'grokbot-skin'\nconst BUILD_ID = '0.2.0'\n"
const hash = text => createHash('sha256').update(text).digest('hex')
function api(version = '0.1.0', overrides = {}) {
 const context = vm.createContext({ BUILD_ID: version, ID: 'grokbot-skin', crypto: webcrypto, URL, TextEncoder, TextDecoder, Uint8Array, AbortController, AbortSignal, setTimeout, clearTimeout, console, document: { documentElement: { dataset: { grokbotSkinBuild: version } } }, matchMedia: () => ({ matches: false }), ...overrides })
 vm.runInContext(runtime + '\nglobalThis.exports={createSkinUpdater,compareUpdateVersions,updateAssetFor,normalizeUpdateRoot,updateImageURL,appendUpdateNotes,UPDATE_INTERVAL_MS,GrokbotUpdateRuntime};', context)
 return context.exports
}
function fixture({ content = b, tamper = false, failDownload = false, corruptWrite = false } = {}) {
 const files = new Map([[target, a]])
 const values = new Map(), calls = [], writes = []
 const storage = { get: (key, fallback) => values.has(key) ? values.get(key) : fallback, set: (key, value) => values.set(key, value), remove: key => values.delete(key) }
 const asset = { id: 101, name: 'grokbot-skin-plugin.js', size: Buffer.byteLength(content), digest: 'sha256:' + hash(content), url: `https://api.github.com/repos/${repo}/releases/assets/101` }
 const releases = [{ id: 2, tag_name: 'grokbot-skin-v0.2.0', prerelease: false, draft: false, body: '# Real test notes\n- Test change', assets: [asset] }]
 let corruptOnce = corruptWrite
 const native = {
  desktopPluginsRoot: async () => root,
  readPluginSource: async path => { if (!files.has(path)) throw new Error('Missing fixture path'); return { text: files.get(path), truncated: false } },
  writeTextFile: async (path, text) => { writes.push(path); files.set(path, path === target && corruptOnce ? 'corrupted' : text); if (path === target) corruptOnce = false; return { path } }
 }
 const fetcher = async (url, options) => {
  calls.push({ url, options })
  if (url.includes('/assets/')) return failDownload ? new Response('', { status: 503 }) : new Response(tamper ? content.replace('0.2.0', '0.9.0') : content)
  return Response.json(releases)
 }
 const updater = api().createSkinUpdater(storage, native, fetcher)
 return { updater, files, values, storage, native, fetcher, calls, writes, releases, asset }
}
test('release comparison and asset admission are strict', () => {
 const u = api()
 assert.equal(u.UPDATE_INTERVAL_MS, 3600000)
 assert.equal(u.compareUpdateVersions('0.2.0', '0.1.0'), 1)
 assert.equal(u.compareUpdateVersions('0.3.0', '0.2.0'), 1)
 assert.equal(u.compareUpdateVersions('0.0.9', '0.1.0'), -1)
 assert.equal(u.compareUpdateVersions('latest', '0.3.0'), null)
 const f = fixture()
 try {
  assert.ok(u.updateAssetFor(f.releases[0]))
  assert.equal(u.updateAssetFor({ ...f.releases[0], draft: true }), null)
  assert.equal(u.updateAssetFor({ ...f.releases[0], assets: [{ ...f.asset, url: 'https://example.invalid/steal' }] }), null)
  assert.equal(u.updateAssetFor({ ...f.releases[0], assets: [{ ...f.asset, digest: null }] }), null)
  assert.equal(u.updateAssetFor({ ...f.releases[0], prerelease: true }), null)
 } finally { f.updater.dispose() }
})
test('verified A to B writes only local skin paths; success requires loading B', async () => {
 const f = fixture()
 let next
 try {
  f.updater.accept(await f.updater.firstPage())
  assert.equal(f.updater.state.phase, 'available')
  await Promise.all([f.updater.install(), f.updater.install()])
  assert.equal(f.calls.filter(call => call.url.includes('/assets/')).length, 1)
  assert.equal(f.files.get(target), b)
  assert.equal(f.files.get(`${root}/grokbot-skin/update-rollback.js`), a)
  assert.equal(f.updater.state.phase, 'awaiting-reload', 'writing bytes alone is not success')
  assert.equal(f.values.get('last-update'), undefined)
  assert.ok(f.calls.every(call => call.url.startsWith(`https://api.github.com/repos/${repo}/releases`)))
  assert.ok(f.calls.every(call => !call.options.headers.Authorization && call.options.credentials === 'omit'))
  assert.ok(f.writes.every(path => path.startsWith(root + '/grokbot-skin/')))
  f.updater.dispose()
  next = api('0.2.0').createSkinUpdater(f.storage, f.native, f.fetcher)
  await next.initialize()
  assert.equal(next.state.phase, 'done')
  assert.equal(f.values.get('last-update').digest, hash(b))
  assert.equal(f.values.has('update-pending'), false)
 } finally { f.updater.dispose(); next?.dispose() }
})
for (const [name, options] of [
 ['digest mismatch', { tamper: true }], ['network failure', { failDownload: true }],
 ['wrong plugin identity', { content: b.replace('grokbot-skin', 'different-plugin') }],
 ['wrong build version', { content: b.replace('0.2.0', '0.8.0') }]
]) test(`${name} never replaces the working file`, async () => {
 const f = fixture(options)
 try { f.updater.accept(await f.updater.firstPage()); await f.updater.install(); assert.equal(f.updater.state.phase, 'error'); assert.equal(f.files.get(target), a); assert.equal(f.writes.includes(target), false); assert.equal(f.values.has('update-pending'), false) }
 finally { f.updater.dispose() }
})
test('a corrupted install is restored from the previous bytes', async () => {
 const f = fixture({ corruptWrite: true })
 try { f.updater.accept(await f.updater.firstPage()); await f.updater.install(); assert.equal(f.updater.state.phase, 'error'); assert.equal(f.files.get(target), a); assert.equal(f.values.has('update-pending'), false) }
 finally { f.updater.dispose() }
})
test('no newer release means no button; unsupported shell fails closed', async () => {
 const f = fixture()
 try {
  f.updater.accept({ releases: [{ ...f.releases[0], tag_name: 'grokbot-skin-v0.1.0' }], checkedAt: Date.now() })
  assert.equal(f.updater.state.phase, 'idle')
  const unsupported = api().createSkinUpdater(f.storage, {}, f.fetcher)
  try { assert.equal(unsupported.capable, false); await assert.rejects(unsupported.initialize(), /does not support/); assert.equal(f.calls.length, 0) }
  finally { unsupported.dispose() }
 } finally { f.updater.dispose() }
})

test('remount recovers a pending update after the old React controller was disposed', async () => {
 const f = fixture(); let replacement
 try {
  f.updater.accept(await f.updater.firstPage()); await f.updater.install(); f.updater.dispose()
  f.values.get('update-pending').startedAt = Date.now() - 10001
  replacement = api().createSkinUpdater(f.storage, f.native, f.fetcher)
  await replacement.initialize(); await new Promise(resolve => setTimeout(resolve, 60))
  assert.equal(f.files.get(target), a); assert.equal(f.values.has('update-pending'), false); assert.equal(replacement.state.phase, 'error')
 } finally { f.updater.dispose(); replacement?.dispose() }
})
test('unverified rollback retains its receipt and never claims success', async () => {
 const f = fixture(); const write = f.native.writeTextFile
 f.native.writeTextFile = async (path, text) => write(path, path === target ? 'persistently corrupted' : text)
 try {
  f.updater.accept(await f.updater.firstPage()); await f.updater.install()
  assert.equal(f.updater.state.phase, 'error'); assert.equal(f.values.has('update-pending'), true)
  assert.match(f.updater.state.error, /Restoration could not be verified/)
  assert.equal(f.files.get(`${root}/grokbot-skin/update-rollback.js`), a)
 } finally { f.updater.dispose() }
})
test('streamless response is rejected without allocating an unbounded arrayBuffer', async () => {
 const f = fixture(); let allocated = false
 const u = api().createSkinUpdater(f.storage, f.native, (url, options) => url.includes('/assets/') ? Promise.resolve({ ok: true, body: null, arrayBuffer() { allocated = true; throw new Error('unsafe buffer') } }) : f.fetcher(url, options))
 try { u.accept(await u.firstPage()); await u.install(); assert.equal(allocated, false); assert.equal(u.state.phase, 'error'); assert.equal(f.files.get(target), a) }
 finally { f.updater.dispose(); u.dispose() }
})
test('native plugin roots require an absolute path without traversal', () => {
 const normalize = api().normalizeUpdateRoot
 assert.equal(normalize('/Users/name/.hermes/desktop-plugins/'), '/Users/name/.hermes/desktop-plugins')
 assert.equal(normalize('C:\\Users\\name\\.hermes\\desktop-plugins'), 'C:/Users/name/.hermes/desktop-plugins')
 for (const path of ['relative/desktop-plugins', '/tmp/../desktop-plugins', '/tmp/not-plugins', '/tmp/\u0000/desktop-plugins']) assert.throws(() => normalize(path))
})

test('only scoped stable skin tags and named assets are admitted from the shared kit', async () => {
 const f = fixture(), u = api()
 try {
  for (const tag_name of ['v2026.09.12', 'v0.2.0', '0.2.0', 'grokbot-skin-v0.2.0-test.1', 'grokbot-skin-v01.2.0', 'grokbot-skin-v999999999999999999.0.0']) {
   assert.equal(u.updateAssetFor({ ...f.releases[0], tag_name }), null, tag_name)
  }
  for (const asset of [{ ...f.asset, name: 'plugin.js' }, { ...f.asset, size: NaN }, { ...f.asset, size: 1.5 }, { ...f.asset, size: 1000001 }, { ...f.asset, id: -1 }]) {
   assert.equal(u.updateAssetFor({ ...f.releases[0], assets: [asset] }), null)
  }
  f.updater.accept({ releases: [{ ...f.releases[0], tag_name: 'v2026.09.12' }, ...f.releases] })
  assert.equal(f.updater.state.releases.length, 1)
  assert.equal(f.updater.state.target.tag_name, 'grokbot-skin-v0.2.0')
  await f.updater.install()
  assert.ok(f.calls.every(call => !call.options.headers.Authorization))
  assert.ok(f.writes.every(path => !path.includes('test-access') && !path.includes('test-report')))
 } finally { f.updater.dispose() }
})

test('kit-only release pages do not hide a skin update', async () => {
 const f = fixture(), calls = []
 const kit = Array.from({ length: 10 }, (_, id) => ({ id: 1000 + id, tag_name: `v2026.09.${id}`, assets: [] }))
 const updater = api().createSkinUpdater(f.storage, f.native, async url => {
  calls.push(url)
  return Response.json(url.endsWith('page=1') ? kit : f.releases)
 })
 try {
  updater.accept(await updater.firstPage())
  assert.equal(calls.length, 2)
  assert.equal(updater.state.page, 2)
  assert.equal(updater.state.releases.length, 1)
  assert.equal(updater.state.phase, 'available')
 } finally { updater.dispose(); f.updater.dispose() }
})

test('release scanning is bounded even when the kit has no skin releases', async () => {
 const f = fixture(); let calls = 0
 const updater = api().createSkinUpdater(f.storage, f.native, async () => {
  calls++
  return Response.json(Array.from({ length: 10 }, (_, id) => ({ id, tag_name: 'v2026.09.12', assets: [] })))
 })
 try {
  updater.accept(await updater.firstPage())
  assert.equal(calls, 10)
  assert.equal(updater.state.phase, 'idle')
 } finally { updater.dispose(); f.updater.dispose() }
})

test('truncated local source is rejected before replacing the working file', async () => {
 const f = fixture(), read = f.native.readPluginSource
 f.native.readPluginSource = async path => ({ ...await read(path), truncated: path === target })
 try {
  f.updater.accept(await f.updater.firstPage()); await f.updater.install()
  assert.equal(f.updater.state.phase, 'error')
  assert.equal(f.files.get(target), a)
  assert.equal(f.writes.includes(target), false)
 } finally { f.updater.dispose() }
})

test('asset size mismatch is rejected before any disk writes', async () => {
 const f = fixture(); f.asset.size++
 try {
  f.updater.accept(await f.updater.firstPage()); await f.updater.install()
  assert.equal(f.updater.state.phase, 'error')
  assert.match(f.updater.state.error, /incomplete/)
  assert.equal(f.writes.length, 0)
 } finally { f.updater.dispose() }
})

test('disposing during staging prevents commit and resolves the install operation', async () => {
 const f = fixture(), write = f.native.writeTextFile
 f.native.writeTextFile = async (path, text) => {
  await write(path, text)
  if (path.endsWith('/update-staged.js')) f.updater.dispose()
 }
 try {
  f.updater.accept(await f.updater.firstPage()); await f.updater.install()
  assert.equal(f.files.get(target), a)
  assert.equal(f.values.has('update-pending'), false)
 } finally { f.updater.dispose() }
})


test('release-note images only load from allowed HTTPS GitHub origins', () => {
 const { updateImageURL } = api()
 for (const url of [
  'https://github.com/thomasbek3/hermes-bot-kit/releases/download/grokbot-skin-v0.2.0/screen.png',
  'https://raw.githubusercontent.com/thomasbek3/hermes-bot-kit/main/screen.png',
  'https://github.com/user-attachments/assets/example',
  'https://user-images.githubusercontent.com/example.png'
 ]) assert.equal(updateImageURL(url), url)
 for (const url of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'http://github.com/user-attachments/assets/x', 'https://evil.invalid/x', 'https://github.com@evil.invalid/x', 'https://github.com/another/repo/releases/download/v1/x', 'https://raw.githubusercontent.com/thomasbek3/hermes-bot-kit-evil/x', 'https://github.com:444/user-attachments/assets/x']) assert.equal(updateImageURL(url), null)
})


test('disposing before native root resolves prevents pending-receipt mutation', async () => {
 const f = fixture(); let resolveRoot
 f.values.set('update-pending', { repository: repo, targetVersion: '0.1.0', digest: hash(a) })
 f.native.desktopPluginsRoot = () => new Promise(resolve => { resolveRoot = resolve })
 const initialize = f.updater.initialize()
 f.updater.dispose(); resolveRoot(root); await initialize
 assert.equal(f.values.has('update-pending'), true)
 assert.equal(f.values.has('last-update'), false)
 assert.equal(f.writes.length, 0)
})

test('disposing before release fetch resolves prevents cache writes', async () => {
 const f = fixture(); let resolveResponse
 const started = new Promise(resolve => {
  f.fetcher = () => { resolve(); return new Promise(done => { resolveResponse = done }) }
 })
 const updater = api().createSkinUpdater(f.storage, f.native, f.fetcher)
 try {
  const page = updater.firstPage()
  await started; updater.dispose(); resolveResponse(Response.json(f.releases))
  await assert.rejects(page, /disposed/)
  assert.equal(f.values.size, 0)
 } finally { updater.dispose(); f.updater.dispose() }
})

test('controller disposal removes mounted views and is safe before React cleanup', () => {
 const listeners = new Set(), observers = new Set()
 class Element {
  constructor() { this.style = { display: '' }; this.dataset = {}; this.children = []; this.attrs = new Map(); this.scrollTop = 0 }
  setAttribute(key, value) { this.attrs.set(key, value) }
  appendChild(node) { node.parent = this; this.children.push(node); return node }
  append(...nodes) { nodes.forEach(node => this.appendChild(node)) }
  replaceChildren() { this.children = [] }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this) }
  addEventListener() {}
  querySelector() { return { style: {} } }
  querySelectorAll() { return [] }
 }
 const events = { addEventListener: (_name, callback) => listeners.add(callback), removeEventListener: (_name, callback) => listeners.delete(callback) }
 const document = { ...events, body: new Element(), createElement: () => new Element() }
 const ResizeObserver = class { constructor(callback) { observers.add(this) } observe() {} disconnect() { observers.delete(this) } }
 const updater = api('0.1.0', { document, window: events, ResizeObserver }).createSkinUpdater({ get: () => null }, {})
 const anchor = new Element(); anchor.style.display = 'flex'; anchor.dataset.grokbotUpdateAnchor = 'original'
 const anchor2 = new Element()
 const cleanup = updater.mount(anchor), cleanup2 = updater.mount(anchor2)
 assert.equal(document.body.children.length, 4)
 assert.equal(listeners.size, 6)
 assert.equal(observers.size, 2)
 updater.dispose()
 assert.equal(document.body.children.length, 0)
 assert.equal(anchor.children.length, 0)
 assert.equal(anchor2.children.length, 0)
 assert.equal(anchor.style.display, 'flex')
 assert.equal(anchor.dataset.grokbotUpdateAnchor, 'original')
 assert.equal(anchor2.style.display, '')
 assert.equal(anchor2.dataset.grokbotUpdateAnchor, undefined)
 assert.equal(listeners.size, 0)
 assert.equal(observers.size, 0)
 cleanup(); cleanup2(); updater.dispose()
 assert.equal(document.body.children.length, 0)
})
