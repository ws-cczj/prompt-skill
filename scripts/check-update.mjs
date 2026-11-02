#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const endpoint = 'https://raw.githubusercontent.com/ws-cczj/prompt-skill/main/release.json';

function validate(value) {
  if (!value || value.schema !== 1 || value.hashMode !== 'utf8-lf' || typeof value.version !== 'string' || !value.files || Array.isArray(value.files) || typeof value.files !== 'object') throw new Error('Invalid release manifest.');
  const entries = Object.entries(value.files);
  if (!entries.length || entries.length > 512) throw new Error('Invalid manifest file count.');
  for (const [name, digest] of entries) {
    if (!/^[A-Za-z0-9_.\-/]+$/.test(name) || name.split('/').some(p => !p || p === '.' || p === '..') || !resolve(root, name).startsWith(root + sep) || !/^[a-f0-9]{64}$/.test(digest)) throw new Error('Invalid manifest path or digest.');
  }
  return value;
}

async function loadLocal() {
  try { return validate(JSON.parse(await readFile(resolve(root, 'release.json'), 'utf8'))); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('Usage: node scripts/check-update.mjs [--manifest <downloaded-release.json>]\nRead-only release comparison. Exit: 0 current, 1 different release, 2 local changes, 3 unknown.'); return;
  }
  if (args.length && (args.length !== 2 || args[0] !== '--manifest')) throw new Error('Use --help for supported arguments.');
  const local = await loadLocal();
  let text;
  if (args.length) text = await readFile(resolve(args[1]), 'utf8');
  else {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000), redirect: 'error' });
    if (!response.ok) throw new Error(`Release request failed: HTTP ${response.status}`);
    text = await response.text();
  }
  if (Buffer.byteLength(text) > 1024 * 1024) throw new Error('Manifest exceeds size limit.');
  const remote = validate(JSON.parse(text));
  if (!local) {
    console.log(JSON.stringify({ status: 'unknown', reason: 'No installed release manifest; back up local files before reinstalling.', remoteVersion: remote.version }));
    process.exitCode = 3; return;
  }
  const modified = [];
  for (const [name, digest] of Object.entries(local.files)) {
    try {
      const text = (await readFile(resolve(root, name), 'utf8')).replaceAll('\r\n', '\n');
      if (createHash('sha256').update(text, 'utf8').digest('hex') !== digest) modified.push(name);
    } catch (error) { if (error.code === 'ENOENT') modified.push(name); else throw error; }
  }
  const names = [...new Set([...Object.keys(local.files), ...Object.keys(remote.files)])].sort();
  const differs = local.version !== remote.version || names.some(name => local.files[name] !== remote.files[name]);
  const status = differs ? modified.length ? 'update_available_local_changes' : 'update_available' : modified.length ? 'local_changes' : 'current';
  console.log(JSON.stringify({ status, installedVersion: local.version, remoteVersion: remote.version, modifiedManagedFiles: modified, scope: 'Manifest-managed files only; preserve additional local files before updating.', source: args.length ? 'downloaded manifest' : endpoint, action: differs ? 'Back up changes, then update prompt-skill in the matching project/global scope and rerun enable.mjs.' : 'No automatic writes performed.' }, null, 2));
  process.exitCode = modified.length ? 2 : differs ? 1 : 0;
}

main().catch(error => { console.log(JSON.stringify({ status: 'unknown', reason: error.message })); process.exitCode = 3; });
