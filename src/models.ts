export interface Model {
  id: string;
  name?: string;
  credits?: string;
  temperature?: number;
  top_p?: number;
  reasoning?: { defaultEffort?: string; effort?: string };
}
export interface Promotion {
  enabled?: boolean;
  kind?: string;
  modelIds?: string[];
  priority?: number;
  schedule?: { validFrom?: string; validUntil?: string };
  discount?: { factor?: number; discountedCredits?: string };
}
export interface ModelConfig { models: Model[]; modelPromotions?: Promotion[] }

export function zeroPrice(value: unknown): boolean {
  return typeof value === 'string' && /^(?:x\s*0(?:\.0+)?|0(?:\.0+)?\s*x)(?:\s+credits)?$/i.test(value.trim());
}
export function active(p: Promotion, now: number): boolean {
  if (p.enabled !== true) return false;
  for (const [field, start] of [['validFrom', true], ['validUntil', false]] as const) {
    const value = p.schedule?.[field];
    if (!value) continue;
    if (!/(?:Z|[+-]\d\d:\d\d)$/i.test(value)) return false;
    const boundary = Date.parse(value);
    if (!Number.isFinite(boundary) || (start ? now < boundary : now >= boundary)) return false;
  }
  return true;
}
export function selectFreeModels(config: ModelConfig, now = Date.now()): Map<string, Model> {
  const result = new Map<string, Model>();
  for (const model of config.models) {
    if (!model.id) continue;
    const related = (config.modelPromotions ?? []).filter(p => p.kind === 'discount' && p.modelIds?.includes(model.id));
    const current = related.filter(p => active(p, now)).sort((a,b) => (b.priority ?? 0) - (a.priority ?? 0));
    const discount = current[0]?.discount;
    const free = current.length
      ? discount?.factor === 0 || zeroPrice(discount?.discountedCredits)
      : related.length === 0 && zeroPrice(model.credits);
    if (free) result.set(model.id, model);
  }
  return result;
}
