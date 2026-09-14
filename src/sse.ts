/** Decode SSE across arbitrary UTF-8/network boundaries, including CRLF and multiline data. */
export async function* sseData(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let data: string[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let pos: number;
      while ((pos = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, pos).replace(/\r$/, '');
        buffer = buffer.slice(pos + 1);
        if (!line) {
          if (data.length) yield data.join('\n');
          data = [];
        } else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      }
      if (done) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
interface ToolCall { id: string; type: string; function: { name: string; arguments: string } }
interface Chunk {
  id?: string; model?: string; created?: number; usage?: unknown; error?: unknown;
  choices?: Array<{index: number; finish_reason?: string; delta?: {
    content?: string; reasoning_content?: string;
    tool_calls?: Array<{ index: number; id?: string; type?: string; function?: { name?: string; arguments?: string } }>;
  }}>;
}
export async function aggregate(stream: ReadableStream<Uint8Array>, requestedModel: string) {
  let id: string | undefined, model = requestedModel, created: number | undefined, usage: unknown;
  const choices = new Map<number, { content: string; reasoning: string; finish: string | null; tools: Map<number, ToolCall> }>();
  let done = false;
  for await (const payload of sseData(stream)) {
    if (payload === '[DONE]') { done = true; break; }
    const chunk = JSON.parse(payload) as Chunk;
    if (chunk.error) throw new Error('Upstream SSE error');
    id = chunk.id ?? id; model = chunk.model ?? model; created = chunk.created ?? created;
    if (chunk.usage != null) usage = chunk.usage;
    for (const c of chunk.choices ?? []) {
      const target = choices.get(c.index) ?? { content: '', reasoning: '', finish: null, tools: new Map<number,ToolCall>() };
      choices.set(c.index, target);
      const d = c.delta ?? {};
      target.content += d.content ?? ''; target.reasoning += d.reasoning_content ?? '';
      if (c.finish_reason) target.finish = c.finish_reason;
      for (const call of d.tool_calls ?? []) {
        const tool = target.tools.get(call.index) ?? { id: '', type: 'function', function: { name: '', arguments: '' } };
        target.tools.set(call.index, tool);
        if (call.id) tool.id = call.id;
        if (call.type) tool.type = call.type;
        tool.function.name += call.function?.name ?? '';
        tool.function.arguments += call.function?.arguments ?? '';
      }
    }
  }
  if (!done || !choices.size || [...choices.values()].some(c => !c.finish)) throw new Error('Incomplete upstream stream');
  return {
    id, object: 'chat.completion', created, model, usage,
    choices: [...choices.entries()].sort(([a],[b]) => a-b).map(([index,c]) => ({
      index, finish_reason: c.finish,
      message: { role: 'assistant', content: c.content,
        ...(c.reasoning ? { reasoning_content: c.reasoning } : {}),
        ...(c.tools.size ? { tool_calls: [...c.tools.entries()].sort(([a],[b]) => a-b).map(([,v]) => v) } : {}) },
    })),
  };
}
