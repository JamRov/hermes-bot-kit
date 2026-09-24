#!/usr/bin/env bash
# Installs only the Grokbot skin; follows the kit's stage/verify/backup convention.
set -euo pipefail

fail() { printf 'grokbot-skin: %s\n' "$*" >&2; exit 1; }
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'EOF'
Install: bash grokbot-skin/install.sh
Uninstall (preserves a backup): bash grokbot-skin/install.sh --uninstall

HERMES_HOME          App-level Hermes home (default ~/.hermes; never a profile)
GROKBOT_REF          Remote git ref (default feat/grokbot-skin)
GROKBOT_SOURCE_DIR   Local grokbot-skin directory (auto-detected from a clone)

Installation requires Node.js and either a checkout or curl. The checksum,
plugin identity and module syntax are verified before the live file is touched.
Reload plugins in Hermes Desktop after installing or uninstalling.
EOF
  exit 0
fi
[ "$#" -le 1 ] || fail 'Unexpected arguments; use --help.'
[ -z "${1:-}" ] || [ "$1" = '--uninstall' ] || fail 'Unknown option; use --help.'

HERMES_DIR="${HERMES_HOME:-$HOME/.hermes}"
HERMES_DIR="${HERMES_DIR%/}"
case "$HERMES_DIR" in /*) ;; *) fail 'HERMES_HOME must be an absolute app-level path.' ;; esac
case "$HERMES_DIR/" in */profiles/*|*/../*|*/./*) fail 'Use the app-level Hermes home, without traversal or a profile path.' ;; esac
PLUGIN_ROOT="$HERMES_DIR/desktop-plugins"
PLUGIN_DIR="$PLUGIN_ROOT/grokbot-skin"
TARGET="$PLUGIN_DIR/plugin.js"
[ ! -L "$PLUGIN_ROOT" ] && [ ! -L "$PLUGIN_DIR" ] && [ ! -L "$TARGET" ] || fail 'Refusing a symlinked plugin destination.'
[ ! -e "$TARGET" ] || [ -f "$TARGET" ] || fail 'Plugin entrypoint exists but is not a regular file.'

if [ "${1:-}" = '--uninstall' ]; then
  if [ -d "$PLUGIN_DIR" ]; then
    BACKUP_ROOT="$HERMES_DIR/desktop-plugin-backups"
    [ ! -L "$BACKUP_ROOT" ] || fail 'Refusing a symlinked backup destination.'
    mkdir -p "$BACKUP_ROOT"
    BACKUP="$BACKUP_ROOT/grokbot-skin.$(date +%Y%m%d%H%M%S).$$"
    mv "$PLUGIN_DIR" "$BACKUP"
    printf 'Skin removed from plugin discovery; backup: %s\n' "$BACKUP"
  else
    printf 'Grokbot skin is already uninstalled.\n'
  fi
  printf 'In Hermes Desktop: Cmd+Shift+P → Reload plugins.\n'
  exit 0
fi

command -v node >/dev/null 2>&1 || fail 'Node.js is required to validate the plugin before installation.'
SOURCE_DIR="${GROKBOT_SOURCE_DIR:-}"
if [ -z "$SOURCE_DIR" ] && [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
  SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
  if [ -f "$SCRIPT_DIR/plugin.js" ]; then SOURCE_DIR="$SCRIPT_DIR"; fi
fi
GROKBOT_REF="${GROKBOT_REF:-feat/grokbot-skin}"
case "$GROKBOT_REF" in ''|*[!a-zA-Z0-9._/-]*|*..*) fail 'Invalid GROKBOT_REF.' ;; esac
RAW_BASE="https://raw.githubusercontent.com/thomasbek3/hermes-bot-kit/$GROKBOT_REF/grokbot-skin"
STAGE=$(mktemp -d)
INSTALL_TEMP=''
cleanup() { rm -rf "$STAGE"; if [ -n "$INSTALL_TEMP" ]; then rm -f "$INSTALL_TEMP"; fi; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

for FILE in CHECKSUMS.sha256 plugin.js; do
  if [ -n "$SOURCE_DIR" ]; then
    cp "$SOURCE_DIR/$FILE" "$STAGE/$FILE"
  else
    curl --proto '=https' --tlsv1.2 -fsSL --connect-timeout 15 --max-time 90 --max-filesize 1000000 "$RAW_BASE/$FILE" -o "$STAGE/$FILE"
  fi
done

node - "$STAGE" <<'NODE'
const { readFileSync, statSync } = require('node:fs')
const { createHash } = require('node:crypto')
const dir = process.argv[2]
function fail(message) { console.error(`grokbot-skin: ${message}`); process.exit(1) }
if (statSync(`${dir}/plugin.js`).size > 1000000 || statSync(`${dir}/CHECKSUMS.sha256`).size > 65536) fail('Staged files exceed size limits.')
const bytes = readFileSync(`${dir}/plugin.js`)
const lines = readFileSync(`${dir}/CHECKSUMS.sha256`, 'utf8').trim().split(/\r?\n/)
if (lines.length !== 1 || !/^[a-f0-9]{64}  grokbot-skin-plugin\.js$/.test(lines[0])) fail('Invalid or ambiguous CHECKSUMS.sha256.')
if (createHash('sha256').update(bytes).digest('hex') !== lines[0].slice(0, 64)) fail('Plugin checksum mismatch; installed files are unchanged.')
const source = bytes.toString('utf8')
if (!/^const ID = ['"]grokbot-skin['"]/m.test(source) || !/^const BUILD_ID = ['"](?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)['"]/m.test(source) || !/^export default /m.test(source)) fail('Wrong plugin identity or missing entrypoint.')
NODE
node --check --input-type=module < "$STAGE/plugin.js"

if [ -f "$TARGET" ] && cmp -s "$STAGE/plugin.js" "$TARGET"; then
  printf 'Grokbot skin is already installed with these exact bytes.\n'
else
  mkdir -p "$PLUGIN_DIR"
  INSTALL_TEMP=$(mktemp "$PLUGIN_DIR/.plugin-install.XXXXXX")
  cp "$STAGE/plugin.js" "$INSTALL_TEMP"
  cmp -s "$STAGE/plugin.js" "$INSTALL_TEMP" || fail 'Staged copy verification failed.'
  chmod 644 "$INSTALL_TEMP"
  if [ -f "$TARGET" ]; then
    BACKUP="$TARGET.bak.$(date +%Y%m%d%H%M%S).$$"
    cp -p "$TARGET" "$BACKUP"
    cmp -s "$TARGET" "$BACKUP" || fail 'Backup verification failed.'
    printf 'Previous plugin backup: %s\n' "$BACKUP"
  fi
  mv -f "$INSTALL_TEMP" "$TARGET"
  INSTALL_TEMP=''
  printf 'Grokbot skin installed: %s\n' "$TARGET"
fi
printf 'In Hermes Desktop: Cmd+Shift+P → Reload plugins (or restart the app).\n'
