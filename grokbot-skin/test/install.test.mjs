import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const installer = fileURLToPath(new URL('../install.sh', import.meta.url))
const plugin = version => `const ID = 'grokbot-skin'\nconst BUILD_ID = '${version}'\nexport default {}\n`
const checksum = source => createHash('sha256').update(source).digest('hex') + '  grokbot-skin-plugin.js\n'
function fixture(t) {
 const root = mkdtempSync(join(tmpdir(), 'grokbot-install-')), home = join(root, 'hermes home'), source = join(root, 'source')
 const target = join(home, 'desktop-plugins/grokbot-skin/plugin.js')
 mkdirSync(source)
 t.after(() => rmSync(root, { recursive: true, force: true }))
 const stage = bytes => { writeFileSync(join(source, 'plugin.js'), bytes); writeFileSync(join(source, 'CHECKSUMS.sha256'), checksum(bytes)) }
 stage(plugin('0.1.0'))
 return { root, home, source, target, stage, run: (args = [], env = {}) => spawnSync('bash', [installer, ...args], { encoding: 'utf8', timeout: 10000, env: { ...process.env, HERMES_HOME: home, GROKBOT_SOURCE_DIR: source, ...env } }) }
}
function success(result) { assert.equal(result.status, 0, result.stderr + result.stdout) }

test('first install, identical reinstall, upgrade backup and uninstall stay inside one plugin', t => {
 const f = fixture(t), neighbor = join(f.home, 'desktop-plugins/other')
 mkdirSync(neighbor, { recursive: true }); writeFileSync(join(neighbor, 'plugin.js'), 'untouched')
 success(f.run()); assert.equal(readFileSync(f.target, 'utf8'), plugin('0.1.0'))
 success(f.run()); assert.deepEqual(readdirSync(join(f.home, 'desktop-plugins/grokbot-skin')), ['plugin.js'])
 f.stage(plugin('0.2.0')); success(f.run())
 const files = readdirSync(join(f.home, 'desktop-plugins/grokbot-skin'))
 assert.equal(files.length, 2)
 assert.equal(readFileSync(join(f.home, 'desktop-plugins/grokbot-skin', files.find(name => name.startsWith('plugin.js.bak.'))), 'utf8'), plugin('0.1.0'))
 assert.equal(readFileSync(f.target, 'utf8'), plugin('0.2.0'))
 success(f.run(['--uninstall'])); assert.equal(existsSync(f.target), false)
 const backup = readdirSync(join(f.home, 'desktop-plugin-backups'))[0]
 assert.equal(readFileSync(join(f.home, 'desktop-plugin-backups', backup, 'plugin.js'), 'utf8'), plugin('0.2.0'))
 success(f.run(['--uninstall']))
 assert.equal(readFileSync(join(neighbor, 'plugin.js'), 'utf8'), 'untouched')
})

for (const kind of ['checksum', 'duplicate manifest', 'missing manifest', 'wrong identity', 'invalid syntax']) {
 test(`${kind} aborts before touching an existing plugin`, t => {
  const f = fixture(t); success(f.run())
  if (kind === 'checksum') writeFileSync(join(f.source, 'plugin.js'), plugin('0.2.0'))
  if (kind === 'duplicate manifest') writeFileSync(join(f.source, 'CHECKSUMS.sha256'), checksum(plugin('0.1.0')).repeat(2))
  if (kind === 'missing manifest') rmSync(join(f.source, 'CHECKSUMS.sha256'))
  if (kind === 'wrong identity') f.stage(plugin('0.2.0').replace('grokbot-skin', 'different-plugin'))
  if (kind === 'invalid syntax') f.stage(plugin('0.2.0') + '\nconst broken = ;\n')
  assert.notEqual(f.run().status, 0)
  assert.equal(readFileSync(f.target, 'utf8'), plugin('0.1.0'))
  assert.deepEqual(readdirSync(join(f.home, 'desktop-plugins/grokbot-skin')), ['plugin.js'])
 })
}

test('rejects profile homes and symlinked destinations', t => {
 const f = fixture(t)
 assert.notEqual(f.run([], { HERMES_HOME: join(f.home, 'profiles/example') }).status, 0)
 assert.equal(existsSync(f.home), false)
 mkdirSync(join(f.home, 'desktop-plugins'), { recursive: true })
 const elsewhere = join(f.root, 'elsewhere'); mkdirSync(elsewhere)
 symlinkSync(elsewhere, join(f.home, 'desktop-plugins/grokbot-skin'))
 assert.notEqual(f.run().status, 0)
 assert.deepEqual(readdirSync(elsewhere), [])
})

test('failed atomic replacement preserves old bytes and removes staged file', t => {
 const f = fixture(t); success(f.run()); f.stage(plugin('0.2.0'))
 const bin = join(f.root, 'bin'); mkdirSync(bin)
 writeFileSync(join(bin, 'mv'), '#!/bin/sh\nexit 73\n', { mode: 0o755 })
 assert.notEqual(f.run([], { PATH: `${bin}:${process.env.PATH}` }).status, 0)
 assert.equal(readFileSync(f.target, 'utf8'), plugin('0.1.0'))
 assert.equal(readdirSync(join(f.home, 'desktop-plugins/grokbot-skin')).some(name => name.startsWith('.plugin-install.')), false)
})

test('remote install fetches only this skin at the requested branch', t => {
 const f = fixture(t), bin = join(f.root, 'bin'), remoteInstaller = join(f.root, 'install.sh')
 mkdirSync(bin); writeFileSync(remoteInstaller, readFileSync(installer))
 writeFileSync(join(bin, 'curl'), `#!/usr/bin/env bash\nset -eu\nurl=""\nout=""\nwhile [ "$#" -gt 0 ]; do\n case "$1" in https://*) url="$1" ;; -o) shift; out="$1" ;; esac\n shift\ndone\ncase "$url" in https://raw.githubusercontent.com/thomasbek3/hermes-bot-kit/feat/grokbot-skin/grokbot-skin/*) ;; *) exit 44 ;; esac\ncp "$FIXTURE_SOURCE/\${url##*/}" "$out"\n`, { mode: 0o755 })
 const result = spawnSync('bash', [remoteInstaller], { encoding: 'utf8', timeout: 10000, env: { ...process.env, HERMES_HOME: f.home, GROKBOT_SOURCE_DIR: '', GROKBOT_REF: 'feat/grokbot-skin', FIXTURE_SOURCE: f.source, PATH: `${bin}:${process.env.PATH}` } })
 success(result); assert.equal(readFileSync(f.target, 'utf8'), plugin('0.1.0'))
})
