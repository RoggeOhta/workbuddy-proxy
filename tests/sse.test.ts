import { test, expect } from 'bun:test';
import { aggregate } from '../src/sse.ts';
export function streamOf(text: string, size = 7) {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream<Uint8Array>({start(c) { for(let i=0;i<bytes.length;i+=size)c.enqueue(bytes.slice(i,i+size)); c.close(); }});
}
export function event(data: unknown) { return `data: ${JSON.stringify(data)}\r\n\r\n`; }
test('preserves fragmented UTF-8, reasoning and usage-only final chunks', async () => {
  const stream = ': heartbeat\r\n'+event({id:'id',model:'actual',choices:[{index:0,delta:{reasoning_content:'思考',content:'你好'}}]})
    +event({choices:[{index:0,delta:{content:'！'},finish_reason:'stop'}]})
    +event({choices:[],usage:{credit:0}})+'data: [DONE]\r\n\r\n';
  const result = await aggregate(streamOf(stream,1),'requested');
  expect(result.model).toBe('actual'); expect(result.usage).toEqual({credit:0});
  expect(result.choices[0].message).toEqual({role:'assistant',content:'你好！',reasoning_content:'思考'});
});
test('merges tool argument fragments and preserves choice indexes', async () => {
  const text = event({choices:[{index:0,delta:{tool_calls:[{index:0,id:'call_a',type:'function',function:{name:'read_file',arguments:'{"path":'}}]}},{index:1,delta:{content:'other'},finish_reason:'stop'}]})
    +event({choices:[{index:0,delta:{tool_calls:[{index:0,function:{arguments:'"a.ts"}'}}]},finish_reason:'tool_calls'}]})+'data: [DONE]\n\n';
  const result = await aggregate(streamOf(text),'model');
  expect(result.choices[0].message.tool_calls?.[0].function).toEqual({name:'read_file',arguments:'{"path":"a.ts"}'});
  expect(result.choices[1].message.content).toBe('other');
});
test('rejects truncation instead of presenting incomplete output as success', async () => {
  await expect(aggregate(streamOf(event({choices:[{index:0,delta:{content:'partial'}}]})),'m')).rejects.toThrow('Incomplete');
});
test('rejects upstream error events', async () => {
  const input = streamOf(event({error:{message:'failure'}}));
  await expect(aggregate(input, 'm')).rejects.toThrow('Upstream SSE error');
});
