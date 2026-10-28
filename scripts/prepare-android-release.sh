#!/usr/bin/env bash
set -euo pipefail
# Titanes Dominó Android release 1.0.3: reproduce the deployed web shell.
# Run from repository root after installing Node dependencies. Does NOT sign or publish anything.
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
# Copy only public web assets. Never bundle .env, credentials, SQL or repository metadata.
node <<'NODE'
const fs=require('fs'),path=require('path');
const allowed=new Set(['.html','.js','.mjs','.css','.png','.jpg','.jpeg','.webp','.svg','.ico','.webmanifest','.json','.woff','.woff2','.ttf']);
const excluded=new Set(['www','android','ios','node_modules','.git','.github','security','scripts','tests','supabase','.vercel']);
function copy(dir='.') {
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(entry.name.startsWith('.') || excluded.has(entry.name)) continue;
  const src=path.join(dir,entry.name);
  if(entry.isDirectory()){copy(src);continue;}
  if(!entry.isFile() || !allowed.has(path.extname(entry.name).toLowerCase()))continue;
  if(entry.name==='package.json'||entry.name==='package-lock.json'||entry.name==='capacitor.config.json'||entry.name==='tsconfig.json')continue;
  const dest=path.join('www',src);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(src,dest);
 }
}
copy();
NODE
test -f www/index.html
if grep -q "sb.from('members').select('\*').eq('auth_user_id',session.user.id)" www/index.html; then
  echo "BLOCKED: stale bundled web app" >&2; exit 1
fi
if [[ -d android ]]; then
  npx cap sync android
  echo "Android web assets synchronized."
else
  echo "Web assets prepared. Initialize native project with npx cap add android, then npx cap sync android."
fi
echo "Verify Android API 36, versionCode > current Play version and signing before building AAB."
