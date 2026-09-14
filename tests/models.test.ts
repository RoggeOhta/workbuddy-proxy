import { describe, test, expect } from 'bun:test';
import { active, selectFreeModels, zeroPrice, type ModelConfig, type Promotion } from '../src/models.ts';
const now = Date.parse('2026-09-14T00:00:00Z');
const trial: Promotion = { kind: 'discount', enabled: true, modelIds: ['trial'], priority: 10,
  discount: { factor: 0 }, schedule: { validFrom: '2026-09-01T00:00:00Z', validUntil: '2026-09-15T00:00:00Z' } };
const config: ModelConfig = { models: [{id: 'free', credits:'x0.00'}, {id:'paid', credits:'x0.29'}, {id:'auto',credits:''}, {id:'trial',credits:'x0.00'}], modelPromotions:[trial] };
describe('Free model selection', () => {
  test('recognizes explicit zero rates and rejects unknown or paid rates', () => {
    for (const x of ['x0.00', '0x', 'x0.00 credits']) expect(zeroPrice(x)).toBe(true);
    for (const x of ['', undefined, null, 0, 'free', 'x0.29', 'x1.00']) expect(zeroPrice(x)).toBe(false);
  });
  test('lists only free models and active trials', () => expect([...selectFreeModels(config,now).keys()]).toEqual(['free','trial']));
  test('expires at the exact end time despite promotional zero rate', () => expect([...selectFreeModels(config,Date.parse(trial.schedule!.validUntil!)).keys()]).toEqual(['free']));
  test('does not expose a future or disabled trial', () => {
    expect(active(trial, Date.parse('2026-08-01T00:00:00Z'))).toBe(false);
    expect(active({...trial,enabled:false},now)).toBe(false);
  });
  test('fails closed for invalid or timezone-free schedules', () => {
    for (const validUntil of ['invalid','2026-09-15T00:00:00']) expect(active({...trial,schedule:{validUntil}},now)).toBe(false);
  });
  test('uses the highest priority current promotion', () => {
    const paid = {...trial,priority:20,discount:{factor:0.5,discountedCredits:'x0.5'}};
    expect([...selectFreeModels({...config,modelPromotions:[trial,paid]},now).keys()]).toEqual(['free']);
  });
});
