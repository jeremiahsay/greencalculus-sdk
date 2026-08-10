/**
 * GreenCalculus — the carbon-accounting API.
 *
 * Sourced greenhouse-gas emission factors and audit-traced calculations, every
 * value traceable to its source cell and data version. Zero dependencies (uses
 * the platform `fetch`; Node 18+ or any browser).
 *
 *   import { GreenCalculus } from "greencalculus";
 *   const gc = new GreenCalculus({ apiKey: "gc_live_..." });
 *   const f = await gc.factor("grid.gbr.electricity.location_based");
 *   const r = await gc.ghgActivity({
 *     activity: { value: 1000, unit: "kWh" },
 *     factor_key: "grid.gbr.electricity.location_based",
 *   });
 */

export interface GreenCalculusOptions {
  /** Your API key — get a free one at https://greencalculus.com/developers */
  apiKey: string;
  /** Override the gateway base URL (default https://api.greencalculus.com). */
  baseUrl?: string;
  /** Provide a fetch implementation (needed on Node < 18). */
  fetch?: typeof fetch;
}

export class GreenCalculusError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(`[${status} ${code}] ${message}`);
    this.name = "GreenCalculusError";
    this.status = status;
    this.code = code;
  }
}

type Body = Record<string, unknown>;
type Json = Record<string, any>;

const VERSION = "0.1.0";

export class GreenCalculus {
  private apiKey: string;
  private baseUrl: string;
  private fetchImpl: typeof fetch;

  constructor(opts: GreenCalculusOptions) {
    if (!opts || !opts.apiKey) {
      throw new Error("apiKey is required — get a free one at https://greencalculus.com/developers");
    }
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? "https://api.greencalculus.com").replace(/\/$/, "");
    const f = opts.fetch ?? (globalThis as any).fetch;
    if (!f) throw new Error("No fetch available — pass opts.fetch (Node < 18).");
    this.fetchImpl = f.bind(globalThis);
  }

  private async request(
    method: string,
    path: string,
    opts: { params?: Record<string, unknown>; body?: Body } = {}
  ): Promise<Json> {
    let url = this.baseUrl + path;
    if (opts.params) {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(opts.params)) if (v != null) q.set(k, String(v));
      const s = q.toString();
      if (s) url += "?" + s;
    }
    const res = await this.fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": `greencalculus-js/${VERSION}`,
      },
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
    });
    const data = (await res.json().catch(() => ({}))) as Json;
    if (!res.ok) {
      const e = (data && (data.error as Json)) || {};
      throw new GreenCalculusError(res.status, e.code ?? "http_error", e.message ?? res.statusText);
    }
    return data;
  }

  // ── factors ──────────────────────────────────────────────────────────
  /** Look up a single emission factor by key. `asOf` pins a past data version. */
  factor(key: string, asOf?: string): Promise<Json> {
    return this.request("GET", `/v1/factors/${encodeURIComponent(key)}`, { params: { as_of: asOf } });
  }

  /** Resolve a plain-language description to the best-matched factor(s). */
  resolve(description: string, extra: Body = {}): Promise<Json> {
    return this.request("POST", "/v1/calculate/resolve", { body: { description, ...extra } });
  }

  // ── calculations ─────────────────────────────────────────────────────
  /** Run any calculation methodology. */
  calculate(methodology: string, body: Body): Promise<Json> {
    return this.request("POST", `/v1/calculate/${methodology}`, { body });
  }

  ghgActivity(body: Body): Promise<Json> {
    return this.calculate("ghg-activity", body);
  }
  pcaf(body: Body): Promise<Json> {
    return this.calculate("pcaf", body);
  }
  embodied(body: Body): Promise<Json> {
    return this.calculate("embodied", body);
  }
  electricity(body: Body): Promise<Json> {
    return this.calculate("electricity", body);
  }
  freight(body: Body): Promise<Json> {
    return this.calculate("freight", body);
  }
  spendBased(body: Body): Promise<Json> {
    return this.calculate("spend-based", body);
  }
  businessTravel(body: Body): Promise<Json> {
    return this.calculate("business-travel", body);
  }
  batch(calculations: Body[]): Promise<Json> {
    return this.calculate("batch", { calculations });
  }
}

export default GreenCalculus;
