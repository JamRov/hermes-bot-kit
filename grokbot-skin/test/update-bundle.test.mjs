import assert from 'node:assert/strict'
import test from 'node:test'
import { bundleUpdater } from '../scripts/build-updater.mjs'
test('updater bundling is deterministic and rejects incomplete or duplicate markers', () => {
 const plain = 'const existing = true;\n'
 const once = bundleUpdater(plain, 'const updater = true;')
 assert.equal(bundleUpdater(once, 'const updater = true;'), once)
 for (const source of [plain+'// BEGIN GENERATED UPDATE RUNTIME', plain+'// END GENERATED UPDATE RUNTIME', once+once]) assert.throws(() => bundleUpdater(source,'const updater=true;'))
})

test('build creates a checksum for the published asset and is repeatable', async () => {
 const { mkdtemp, mkdir, readFile, writeFile, rm } = await import('node:fs/promises')
 const { tmpdir } = await import('node:os')
 const { join } = await import('node:path')
 const { spawnSync } = await import('node:child_process')
 const { createHash } = await import('node:crypto')
 const dir = await mkdtemp(join(tmpdir(), 'grokbot-updater-build-'))
 try {
  await mkdir(join(dir, 'scripts')); await mkdir(join(dir, 'src'))
  await writeFile(join(dir, 'scripts/build-updater.mjs'), await readFile(new URL('../scripts/build-updater.mjs', import.meta.url)))
  await writeFile(join(dir, 'src/update-runtime.js'), await readFile(new URL('../src/update-runtime.js', import.meta.url)))
  await writeFile(join(dir, 'src/skin.js'), "const ID = 'grokbot-skin'\nconst BUILD_ID = '0.1.0'\nexport default {}\n")
  const run = () => spawnSync(process.execPath, [join(dir, 'scripts/build-updater.mjs')], { encoding: 'utf8' })
  const first = run(); assert.equal(first.status, 0, first.stderr)
  const source = await readFile(join(dir, 'plugin.js'), 'utf8')
  assert.match(source, /function createSkinUpdater/)
  assert.match(source, /Copyright \(c\) 2026 FPSUnleashed/)
  assert.equal(await readFile(join(dir, 'desktop/plugin.js'), 'utf8'), source)
  assert.match(await readFile(join(dir, 'plugin.yaml'), 'utf8'), /name: grokbot-skin\nversion: "0.1.0"/)
  assert.equal(await readFile(join(dir, 'CHECKSUMS.sha256'), 'utf8'), createHash('sha256').update(source).digest('hex') + '  grokbot-skin-plugin.js\n')
  const second = run(); assert.equal(second.status, 0, second.stderr)
  assert.equal(await readFile(join(dir, 'plugin.js'), 'utf8'), source)
  await writeFile(join(dir, 'src/skin.js'), "const ID = 'grokbot-skin'\nconst BUILD_ID = '0.2.0'\nexport default {}\n")
  const changed = run(); assert.equal(changed.status, 0, changed.stderr)
  const next = await readFile(join(dir, 'plugin.js'), 'utf8')
  assert.match(next, /BUILD_ID = '0.2.0'/)
  assert.equal(await readFile(join(dir, 'desktop/plugin.js'), 'utf8'), next)
  assert.match(await readFile(join(dir, 'plugin.yaml'), 'utf8'), /version: "0.2.0"/)
  await writeFile(join(dir, 'src/skin.js'), "const ID = 'grokbot-skin'\nconst BUILD_ID = '0.3.0'\nexport default { BROKEN\n")
  assert.notEqual(run().status, 0)
  assert.equal(await readFile(join(dir, 'plugin.js'), 'utf8'), next, 'failed build leaves previous artifacts untouched')
 } finally { await rm(dir, { recursive: true, force: true }) }
})
