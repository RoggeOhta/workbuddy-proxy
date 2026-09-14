import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { createHandler } from './app.ts';
import { Upstream } from './upstream.ts';
const keyFile = process.env.API_KEY_FILE ?? join(process.cwd(), '.api-key');
await mkdir(dirname(keyFile), { recursive: true });
try { await writeFile(keyFile, randomBytes(32).toString('base64url'), { flag: 'wx', mode: 0o600 }); }
catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; }
const key = (await readFile(keyFile, 'utf8')).trim();
if (!key) throw new Error('API key file must not be empty');
const authFile = process.env.WORKBUDDY_AUTH_FILE ?? join(homedir(), 'Library/Application Support/CodeBuddyExtension/Data/Public/auth/workbuddy-desktop-ai.info');
const server = Bun.serve({
  hostname: process.env.LISTEN_HOST ?? '127.0.0.1', port: Number(process.env.PORT ?? 18080),
  maxRequestBodySize: 16 * 1024 * 1024, idleTimeout: 240,
  fetch: createHandler(key, new Upstream(authFile)),
});
console.log(`WorkBuddy Free Proxy listening on ${server.url}`);
console.log(`Proxy API key file: ${keyFile}`);
process.on('SIGTERM', () => { server.stop(true); process.exit(0); });
process.on('SIGINT', () => { server.stop(true); process.exit(0); });
