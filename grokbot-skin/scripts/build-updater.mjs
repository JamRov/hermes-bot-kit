// Adapted from FPSUnleashed/hermes-codex-skin (MIT); see ../LICENSE.
import { readFile, writeFile, rename, unlink, mkdir } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname } from 'node:path'
const begin = '// BEGIN GENERATED UPDATE RUNTIME'
const end = '// END GENERATED UPDATE RUNTIME'
export function bundleUpdater(source, runtime) {
  const start = source.indexOf(begin), finish = source.indexOf(end)
  if ((start < 0) !== (finish < 0) || (start >= 0 && finish < start)) throw new Error('Incomplete updater markers')
  if (source.indexOf(begin, start + begin.length) >= 0 || source.indexOf(end, finish + end.length) >= 0) throw new Error('Duplicate updater markers')
  const block = `${begin}\n${runtime.trim()}\n${end}\n`
  return start < 0 ? `${source.trimEnd()}\n\n${block}` : source.slice(0, start) + block + source.slice(finish + end.length).trimStart()
}
async function build() {
  const plugin = new URL('../plugin.js', import.meta.url)
  const source = await readFile(new URL('../src/skin.js', import.meta.url), 'utf8')
  const version = /^const BUILD_ID = ['"]((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))['"]/m.exec(source)?.[1]
  if (!/^const ID = ['"]grokbot-skin['"]/m.test(source) || !version) throw new Error('Invalid skin identity or build version')
  const runtime = await readFile(new URL('../src/update-runtime.js', import.meta.url), 'utf8')
  const output = bundleUpdater(source, runtime)
  const check = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: output, encoding: 'utf8' })
  if (check.status !== 0) throw new Error(check.stderr || 'Generated module did not parse')
  if (Buffer.byteLength(output) > 1_000_000) throw new Error('Plugin exceeds the updater download limit')
  const digest = createHash('sha256').update(output).digest('hex')
  const files = [
    [plugin, output],
    [new URL('../desktop/plugin.js', import.meta.url), output],
    [new URL('../plugin.yaml', import.meta.url), `name: grokbot-skin\nversion: "${version}"\ndescription: >-\n  Grokbot-inspired desktop layout and chat styling with native Hermes controls.\nauthor: Thomas Bekkers\nkind: standalone\nprovides_tools: []\nprovides_hooks: []\nprovides_middleware: []\nrequires_env: []\n`],
    [new URL('../CHECKSUMS.sha256', import.meta.url), `${digest}  grokbot-skin-plugin.js\n`]
  ]
  const staged = [], committed = []
  try {
    for (const [url, content] of files) {
      const path = fileURLToPath(url), temporary = `${path}.build-${process.pid}.tmp`
      await mkdir(dirname(path), { recursive: true })
      const previous = await readFile(path).catch(error => { if (error.code === 'ENOENT') return null; throw error })
      await writeFile(temporary, content)
      staged.push({ path, temporary, previous })
    }
    for (const entry of staged) { await rename(entry.temporary, entry.path); committed.push(entry) }
  } catch (error) {
    for (const entry of committed.reverse()) { if (entry.previous === null) await unlink(entry.path); else { await writeFile(entry.temporary, entry.previous); await rename(entry.temporary, entry.path) } }
    throw error
  } finally { for (const entry of staged) await unlink(entry.temporary).catch(() => {}) }
  console.log(JSON.stringify({ digest, bytes: Buffer.byteLength(output) }))
}
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) await build()
