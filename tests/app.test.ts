import { test, expect } from 'bun:test';
import { createHandler, type Backend } from '../src/app.ts';
const sse = 'data: {"id":"id","model":"hy3","choices":[{"index":0,"delta":{"content":"OK"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n';
function fixture() {
  const calls: Record<string,unknown>[] = [];
  const backend: Backend = {
    async models() { return new Map([['hy3',{id:'hy3',temperature:0.9,reasoning:{defaultEffort:'high'}}]]); },
    async chat(body) { calls.push(body); return new Response(sse,{headers:{'Content-Type':'text/event-stream'}}); },
  };
  return { backend,calls,handler:createHandler('test-key',backend) };
}
const request = (body: unknown) => new Request('http://localhost/v1/chat/completions', {method:'POST', headers:{Authorization:'Bearer test-key','Content-Type':'application/json'},body:JSON.stringify(body)});
test('requires authentication before accessing upstream', async () => {
  const f=fixture(); f.backend.models=async()=>{throw new Error('must not run');};
  expect((await f.handler(new Request('http://localhost/v1/models'))).status).toBe(401);
});
test('rejects paid/unknown models without calling inference', async () => {
  const f=fixture();expect((await f.handler(request({model:'paid',messages:[{role:'user',content:'hi'}]}))).status).toBe(400);expect(f.calls).toHaveLength(0);
});
test('fails closed when configuration is unavailable', async () => {
  const f=fixture(); f.backend.models=async()=>{throw new Error('offline');};
  expect((await f.handler(request({model:'hy3',messages:[{role:'user',content:'hi'}]}))).status).toBe(502);expect(f.calls).toHaveLength(0);
});
test('preserves large prompts, tools and explicit sampling options', async () => {
  const f=fixture();const prompt='上下文 "quote" \\ newline\n'.repeat(20000);
  const tools=[{type:'function',function:{name:'read_file',parameters:{type:'object'}}}];
  const response=await f.handler(request({model:'hy3',messages:[{role:'system',content:prompt},{role:'user',content:'hi'}],tools,temperature:0.4,stream:true}));
  expect(response.status).toBe(200);expect(await response.text()).toBe(sse);
  expect(f.calls[0].messages).toEqual([{role:'system',content:prompt},{role:'user',content:'hi'}]);expect(f.calls[0].tools).toEqual(tools);
  expect(f.calls[0].temperature).toBe(0.4);expect(f.calls[0].reasoning_effort).toBe('high');
});
test('adds required system message and aggregates non-streaming response', async () => {
  const f=fixture(); const response=await f.handler(request({model:'hy3',messages:[{role:'user',content:'hi'}]}));
  expect(response.status).toBe(200);expect((await response.json()).choices[0].message.content).toBe('OK');
  expect((f.calls[0].messages as Array<{role:string}>)[0].role).toBe('system');expect(f.calls[0].stream).toBe(true);
});
test('validates malformed message bodies', async () => {
  const f=fixture();for(const messages of [[],[null],[{}]])expect((await f.handler(request({model:'hy3',messages}))).status).toBe(400);
});
