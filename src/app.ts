import { timingSafeEqual } from 'node:crypto';
import type { Model } from './models.ts';
import { aggregate } from './sse.ts';
export interface Backend {
  models(signal?: AbortSignal): Promise<Map<string, Model>>;
  chat(body: Record<string, unknown>, signal: AbortSignal): Promise<Response>;
}
const error = (status: number, message: string) => Response.json({ error: { message } }, { status });
export function createHandler(key: string, backend: Backend) {
  const expected = Buffer.from(`Bearer ${key}`);
  return async (req: Request): Promise<Response> => {
    const pathname = new URL(req.url).pathname;
    if (req.method === 'GET' && pathname === '/health') return Response.json({ status: 'ok' });
    const given = Buffer.from(req.headers.get('Authorization') ?? '');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return error(401, 'Invalid proxy API key');
    try {
      if (req.method === 'GET' && pathname === '/v1/models') {
        const models = await backend.models(req.signal);
        return Response.json({ object: 'list', data: [...models.values()].map(m => ({ id: m.id, name: m.name ?? m.id, object: 'model', owned_by: 'workbuddy' })) });
      }
      if (req.method !== 'POST' || pathname !== '/v1/chat/completions') return error(404, 'Not found');
      let body: Record<string, unknown>;
      try { body = await req.json(); } catch { return error(400, 'Invalid JSON body'); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return error(400, 'Expected JSON object');
      const model = body.model ?? 'deepseek-v4.1-flash';
      if (typeof model !== 'string') return error(400, 'model must be a string');
      const messages = body.messages;
      if (!Array.isArray(messages) || !messages.length || messages.some(m => !m || typeof m !== 'object' || typeof m.role !== 'string')) return error(400, 'messages must be a nonempty array of message objects');
      if (body.stream !== undefined && typeof body.stream !== 'boolean') return error(400, 'stream must be a boolean');
      const metadata = (await backend.models(req.signal)).get(model);
      if (!metadata) return error(400, 'Model is not currently free; refresh /v1/models');
      const streaming = body.stream === true;
      const upstreamBody: Record<string, unknown> = { ...body, model, stream: true };
      if (messages[0].role !== 'system') upstreamBody.messages = [{ role: 'system', content: 'You are a helpful assistant.' }, ...messages];
      for (const field of ['temperature', 'top_p'] as const) if (upstreamBody[field] === undefined && metadata[field] !== undefined) upstreamBody[field] = metadata[field];
      const effort = metadata.reasoning?.defaultEffort ?? metadata.reasoning?.effort;
      if (upstreamBody.reasoning_effort === undefined && effort) upstreamBody.reasoning_effort = effort;
      const response = await backend.chat(upstreamBody, req.signal);
      if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream') || !response.body) {
        await response.body?.cancel();
        return error(502, 'Upstream rejected the request or returned a non-SSE response');
      }
      if (streaming) return new Response(response.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } });
      return Response.json(await aggregate(response.body, model));
    } catch {
      return error(502, 'Upstream connection, configuration, or authentication failed');
    }
  };
}
