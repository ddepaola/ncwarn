/** Shared adapter contract (handoff §10.1). Every source implements this; the worker drives it. */
export interface FetchContext {
  since?: Date;
  signal?: AbortSignal;
  runId: string;
}
export interface FetchArtifact {
  externalId?: string;
  sourceUrl: string;
  fetchedAt: Date;
  contentType: string;
  body: string | Uint8Array;
  meta?: Record<string, unknown>;
}
export interface IntermediateRecord {
  externalId: string;
  sourceUrl: string;
  fetchedAt: Date;
  fields: Record<string, unknown>;
}
export type ValidationResult = { ok: true } | { ok: false; reasons: string[] };
export interface NormalizedEvent {
  topic: string;
  type: string;
  title: string;
  summary: string;
  whyItMatters?: string;
  responsibleParty?: string;
  eventDate?: Date;
  deadlineAt?: Date;
  sourceUrl: string;
  sourceExternalId: string;
  sourceUpdatedAt?: Date;
  location?: { lng: number; lat: number; precision: "exact" | "block" | "intersection" | "centroid" | "jurisdiction_only" } | { jurisdictionCountyFips: string; precision: "jurisdiction_only" };
  originalClassification?: string;
}
export interface SourceAdapter {
  key: string;
  parserVersion: string;
  fetch(context: FetchContext): Promise<FetchArtifact[]>;
  parse(artifact: FetchArtifact): Promise<IntermediateRecord[]>;
  validate(record: IntermediateRecord): ValidationResult;
  normalize(record: IntermediateRecord): Promise<NormalizedEvent[]>;
}

const registry = new Map<string, SourceAdapter>();
export function registerAdapter(a: SourceAdapter) { registry.set(a.key, a); }
export function getAdapter(key: string) { return registry.get(key); }
export function listAdapters() { return [...registry.values()]; }
