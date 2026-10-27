#!/usr/bin/env bash
set -euo pipefail
# Titanes Dominó Android release 1.0.3: reproduce the deployed web shell.
# Run from repository root after npm ci. Does NOT sign or publish anything.
cd "$(dirname "$0")/.."
test -f index.html || { echo "Missing index.html" >&2; exit 1; }
if grep -q "sb.from('members').select('\*').eq('auth_user_id',session.user.id)" index.html; then
  echo "BLOCKED: outdated profile query still selects PIN hash" >&2
  exit 1
fi
if ! grep -q "sb.from('members').select('id,auth_user_id" index.html; then
  echo "BLOCKED: expected explicit profile projection missing" >&2
  exit 1
fi
mkdir -p www
# Mirror web assets into the local Capacitor webDir, excluding native and repository internals.
tar --exclude='./www' --exclude='./android' --exclude='./ios' --exclude='./node_modules' --exclude='./.git' --exclude='./.github' --exclude='./security' --exclude='./scripts' --exclude='./tests' --exclude='./*.md' --exclude='./*.lock' --exclude='./package.json' --exclude='./capacitor.config.json' -cf - . | (cd www && tar -xf -)
test -f www/index.html
if grep -q "sb.from('members').select('\*').eq('auth_user_id',session.user.id)" www/index.html; then
  echo "BLOCKED: stale bundled web app" >&2; exit 1
fi
npx cap sync android
echo "Android web assets synchronized. Verify Android versionCode >=4 and signing before building AAB."
