# greencalculus

The official JavaScript / TypeScript client for the [GreenCalculus API](https://greencalculus.com/developers) — sourced greenhouse-gas emission factors and audit-traced calculations. Every value comes back with its source cell and data version.

Zero dependencies. Uses the platform `fetch` (Node 18+ or any browser). Ships with TypeScript types.

## Install

```bash
npm install greencalculus
```

## Quickstart

Get a free API key (1,000 calls/month, no card) at **[greencalculus.com/developers](https://greencalculus.com/developers)**.

```ts
import { GreenCalculus } from "greencalculus";

const gc = new GreenCalculus({ apiKey: "gc_live_..." });

// A sourced emission factor. The response nests the row under `factor`, and the
// row carries its numeric value (also under `factor`), plus source & version.
const row = (await gc.factor("grid.gbr.electricity.location_based")).factor;
console.log(row.factor.value, row.factor.unit); // 0.13096 kg CO2e per kWh
console.log(row.source.id);                     // DEFRA_2026

// An audit-traced calculation — the full working, not just a total
const r = await gc.ghgActivity({
  activity: { value: 1000, unit: "kWh" },
  factor_key: "grid.gbr.electricity.location_based",
});
console.log(r.emissions.value, r.emissions.unit, r.source.id);

// Plain language -> the right factor, with a confidence score
const m = await gc.resolve("UK grid electricity");
```

## Calculations

```ts
await gc.pcaf({
  asset_class: "listed_equity_corporate_bonds",
  holdings: [{
    outstanding_amount: 1_000_000,
    denominator: { type: "evic", value: 2_500_000_000_000 },
    company_emissions: { value: 20_000_000 },
    data_quality_score: 2,
  }],
});

await gc.embodied({
  materials: [{
    material_key: "materials.concrete.ready_mix.c8_10",
    quantity: { value: 50, unit: "m3" },
    boundary: "A1-C",
  }],
});

await gc.freight({
  mass: { value: 1, unit: "tonne" },
  distance: { value: 100, unit: "km" },
  factor_key: "freight.rail.tonne_km",
});
```

Also: `electricity`, `spendBased`, `businessTravel`, and `batch([...])`. Any methodology via `gc.calculate("<methodology>", body)`.

## Reproducibility & errors

```ts
// Pin a past data version so a figure reproduces exactly in an audit
await gc.factor("grid.gbr.electricity.location_based", "2026.111");

import { GreenCalculusError } from "greencalculus";
try {
  await gc.factor("does.not.exist");
} catch (e) {
  if (e instanceof GreenCalculusError) console.log(e.status, e.code, e.message);
}
```

## Links

- Docs: https://greencalculus.com/developers/docs
- Data rights & continuity: https://greencalculus.com/developers/trust
- MCP server (agents): `mcp.greencalculus.com`

MIT licensed.
