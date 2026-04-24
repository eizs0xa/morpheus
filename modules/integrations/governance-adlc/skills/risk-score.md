# Skill: risk-score

> Shipped by `integrations/governance-adlc`.

Scores an agent project against the enterprise four-tier risk classification and writes the result into `platform-manifest.json` under `governance.risk_tier` and `governance.review_track`.

## Scoring rubric (four dimensions)

Each dimension is scored 1–4. The agent's risk tier is the **max** of the four dimension scores.

1. **Audience**
   - 1 = internal, small team, opt-in
   - 2 = internal, broad, default-on
   - 3 = customer-facing, non-regulated
   - 4 = customer-facing, regulated (healthcare, finance, gov)
2. **Autonomy**
   - 1 = suggest-only, human-in-the-loop every action
   - 2 = acts within narrow, reversible bounds
   - 3 = acts within broad, reversible bounds
   - 4 = acts within irreversible bounds (writes, sends, transacts) without per-action approval
3. **Data sensitivity**
   - 1 = public / synthetic
   - 2 = internal non-sensitive
   - 3 = customer data, non-regulated
   - 4 = PHI, PII, PCI, or regulated records
4. **Blast radius**
   - 1 = single user session
   - 2 = single team
   - 3 = multi-team / business unit
   - 4 = enterprise or external

## Review-track mapping

| Risk tier | Default review track |
|---|---|
| 1 | `accelerated` |
| 2 | `standard` |
| 3 | `enhanced` |
| 4 | `board` |

## Procedure

1. Read the PRD and spec from the artifact chain.
2. Score each of the four dimensions, citing the artifact line that justified the score.
3. Compute `risk_tier = max(scores)`.
4. Map to review track per the table above.
5. Write both into `platform-manifest.json` → `governance`.
6. Emit an `intake-scored` event to `governance-events.yml`.

## Invariants

- The `risk_tier` MUST be justified by citations from the PRD/spec. No unsupported scores.
- Lowering a previously set `risk_tier` requires steward approval and an ADR.
