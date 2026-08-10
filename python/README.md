# greencalculus

The official Python client for the [GreenCalculus API](https://greencalculus.com/developers) — sourced greenhouse-gas emission factors and audit-traced calculations. Every value comes back with its source cell and data version, so you hand back citable numbers, not guesses.

Zero third-party dependencies (standard library only).

## Install

```bash
pip install greencalculus
```

## Quickstart

Get a free API key (1,000 calls/month, no card) at **[greencalculus.com/developers](https://greencalculus.com/developers)**.

```python
from greencalculus import GreenCalculus

gc = GreenCalculus(api_key="gc_live_...")

# A sourced emission factor. The response nests the row under "factor", and the
# row carries its numeric value (also under "factor"), plus source & version.
row = gc.factor("grid.gbr.electricity.location_based")["factor"]
print(row["factor"]["value"], row["factor"]["unit"])   # 0.13096 kg CO2e per kWh
print(row["source"]["id"])                             # DEFRA_2026

# An audit-traced calculation — the full working, not just a total
r = gc.ghg_activity(
    activity={"value": 1000, "unit": "kWh"},
    factor_key="grid.gbr.electricity.location_based",
)
print(r["emissions"]["value"], r["emissions"]["unit"])
print(r["source"]["id"])                            # e.g. EMBER_YEARLY_ELECTRICITY_2025

# Plain language -> the right factor, with a confidence score
m = gc.resolve("UK grid electricity")
```

## Calculations

Every engine returns the formula, the source, the data version, and a deterministic receipt.

```python
gc.pcaf(asset_class="listed_equity_corporate_bonds", holdings=[{
    "outstanding_amount": 1_000_000,
    "denominator": {"type": "evic", "value": 2_500_000_000_000},
    "company_emissions": {"value": 20_000_000},
    "data_quality_score": 2,
}])

gc.embodied(materials=[{
    "material_key": "materials.concrete.ready_mix.c8_10",
    "quantity": {"value": 50, "unit": "m3"},
    "boundary": "A1-C",
}])

gc.freight(mass={"value": 1, "unit": "tonne"},
           distance={"value": 100, "unit": "km"},
           factor_key="freight.rail.tonne_km")
```

Also available: `electricity`, `spend_based`, `business_travel`, and `batch(calculations=[...])`. Any methodology works via `gc.calculate("<methodology>", **body)`.

## Reproducibility

Pin any factor to a past data version so a figure reproduces exactly in an audit:

```python
gc.factor("grid.gbr.electricity.location_based", as_of="2026.111")
```

## Errors

```python
from greencalculus import GreenCalculusError

try:
    gc.factor("does.not.exist")
except GreenCalculusError as e:
    print(e.status, e.code, e.message)
```

## Links

- Docs: https://greencalculus.com/developers/docs
- Data rights & continuity: https://greencalculus.com/developers/trust
- MCP server (agents): `mcp.greencalculus.com`

MIT licensed.
