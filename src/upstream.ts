import { readFile } from 'node:fs/promises';
import { selectFreeModels, type ModelConfig } from './models.ts';
export class Upstream {
  constructor(private authFile: string) {}
  private async headers() {
    const login = JSON.parse(await readFile(this.authFile, 'utf8'));
    if (!login.auth?.accessToken || !login.account?.uid || !login.auth?.domain) throw new Error('Invalid auth file');
    return {
      Authorization: `Bearer ${login.auth.accessToken}`,
      'X-User-Id': String(login.account.uid), 'X-Domain': login.auth.domain,
      'X-Product': 'SaaS', 'User-Agent': 'WorkBuddy/5.5.2',
      'X-Request-ID': crypto.randomUUID().replaceAll('-', ''), 'Content-Type': 'application/json',
    };
  }
  async models(signal?: AbortSignal) {
    const response = await fetch('https://www.workbuddy.ai/v3/config', {
      headers: await this.headers(), redirect: 'error',
      signal: AbortSignal.any([AbortSignal.timeout(20_000), ...(signal ? [signal] : [])]),
    });
    if (!response.ok) throw new Error('Configuration request failed');
    const payload = await response.json() as { data?: ModelConfig } & ModelConfig;
    const config = payload.data ?? payload;
    if (!Array.isArray(config.models)) throw new Error('Invalid model configuration');
    return selectFreeModels(config);
  }
  async chat(body: Record<string, unknown>, signal: AbortSignal) {
    return fetch('https://www.workbuddy.ai/v2/chat/completions', {
      method: 'POST', headers: { ...await this.headers(), 'X-Model-ID': String(body.model), Accept: 'text/event-stream' },
      body: JSON.stringify(body), redirect: 'error',
      signal: AbortSignal.any([signal, AbortSignal.timeout(180_000)]),
    });
  }
}
