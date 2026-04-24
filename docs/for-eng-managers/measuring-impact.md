# Measuring impact

> Six metric families for tracking Morpheus rollout and impact: adoption, freshness, engagement, quality, velocity, cost. Collect weekly, review monthly.

## Why these six

Each family answers one managerial question:

| Family | Question |
|--------|----------|
| Adoption | Who's using it? |
| Freshness | Is what they're using current? |
| Engagement | Do they actually use it, or just install it? |
| Quality | Is output getting better? |
| Velocity | Are features shipping faster? |
| Cost | What does it cost to run? |

No single metric captures rollout health. Track all six. Triangulate.

## 1. Adoption

What to measure:

- **Projects initialized** — count of repos with `platform-manifest.json`.
- **Teams onboarded** — count of distinct owning teams across those repos.
- **Profile distribution** — count by profile (`builder | verifier | author | explorer | steward`).
- **Stack distribution** — count by stack module in use.

How to collect:

- Daily cron: enumerate org repos, read `platform-manifest.json` where present, publish to a dashboard.
- Attribute owning team from CODEOWNERS.

Targets by rollout phase:

| Phase | Projects | Teams |
|-------|----------|-------|
| 1 (friendly pilot) | 1 | 1 |
| 2 (second pilot) | 2 | 2 |
| 3 (expansion) | 10–15 | 3–5 |
| 4 (org-wide opt-in) | 30+ | 10+ |

## 2. Freshness

What to measure:

- **Platform-version distribution** — for each project, the `platform_version` in its manifest. Report as a histogram.
- **Median lag** — days between the latest platform release and the version a project runs.
- **Update-frequency** — number of projects updated in the last 30 days.

How to collect:

- Same daily cron as Adoption.
- Cross-reference `platform_version` against the tags on the platform repo.

Targets:

- Median lag ≤ 60 days.
- ≥ 75% of active projects on the latest or latest-minus-one minor.
- No project > 2 majors behind without a recorded reason.

## 3. Engagement

What to measure:

- **Skill invocations per week** — count from agent-runtime logs, if available.
- **Feature folders created** — `ls .agent/features/ | wc -l` over time.
- **Lore entries authored** — per project, per month.
- **Holdout suites present** — count of projects with `.agent/holdout/` populated.
- **Constitution amendments** — per project, per quarter.

How to collect:

- Logs depend on the runtime. Start with what's tractable (folder counts, git log).
- Annotate high-usage projects as case studies; annotate low-usage as investigation targets.

Signal interpretation:

| Signal | Interpretation |
|--------|----------------|
| High invocation, low lore. | Team uses agents but isn't capturing learnings — talk to steward. |
| High lore, low invocation. | Team is writing about agents more than using them — investigate. |
| Zero holdouts. | Verifier profile isn't active. Fine for small teams; flag for critical paths. |

## 4. Quality

What to measure:

- **PR revert rate** — reverts ÷ merges, rolling 30 days.
- **CI pass rate on first try** — per team, per project.
- **Coverage delta** — coverage change on agent-authored PRs vs human-authored.
- **Post-merge incident rate** — incidents per 100 merges, per project.
- **Evaluator outcomes** — pass/fail ratios from holdouts.

How to collect:

- PR metadata via the git provider's API.
- Coverage from CI artifacts.
- Incident data from the incident tracker.

Targets:

- Revert rate no worse than pre-Morpheus baseline.
- Coverage delta ≥ 0 on agent-authored PRs.
- Evaluator pass rate > 80% for production projects.

Quality regressions are the most important signal to watch for. If adoption is up and quality is down, the platform is not pulling its weight.

## 5. Velocity

What to measure:

- **Lead time from spec to merge** — per feature, median.
- **Feature throughput** — merged features per team per month.
- **Review turnaround** — PR open → first review, median.
- **Time to first-green CI** — PR open → green CI, median.

How to collect:

- Git provider metadata.
- Feature ID: derive from feature folder name or Jira key on the branch.

Important caveats:

- Velocity alone is meaningless. Always pair with Quality metrics.
- Small teams have noisy velocity signals — report with confidence intervals or don't report at all for teams < 3 contributors.
- Don't optimize for feature count; optimize for outcome achievement.

## 6. Cost

What to measure:

- **Agent-runtime spend** — per project per month (LLM API spend).
- **Platform team time** — hours spent on direct team support vs platform evolution.
- **CI minutes** — additional CI cost from platform workflows (PR gates, merge queues).
- **Steward time** — lore curation + constitution amendments, measured by calendar reserve.

How to collect:

- API billing dashboards.
- Calendar + Linear/Jira time trackers for platform team.
- CI provider billing.

Targets:

- Platform team time on direct support < 20% after Phase 4.
- Agent-runtime spend scales sub-linearly with feature count (caching, skill reuse).
- CI overhead from platform workflows < 15% of total CI minutes.

## Dashboard structure

Minimum viable dashboard:

```
┌─────────────── Morpheus Platform Metrics ───────────────┐
│  Adoption:      projects, teams, profiles, stacks       │
│  Freshness:     version histogram, median lag           │
│  Engagement:    invocations, features, lore, holdouts   │
│  Quality:       revert %, CI first-pass %, coverage Δ   │
│  Velocity:      lead time, throughput, review TAT       │
│  Cost:          runtime $, CI min, platform team hours  │
└─────────────────────────────────────────────────────────┘
```

Publish weekly. Review monthly with Phase-aware targets. Annotate anomalies with the likely cause.

## What not to measure

- **Skill popularity contests.** Don't rank skills. Some skills are load-bearing but rarely invoked.
- **Per-engineer adoption.** Profiles are team/project-level, not individual surveillance.
- **Stack wars.** Reporting "Python projects are Xx faster than Node projects" almost always misreads causation.

## Related docs

- [Rollout guide](rollout-guide.md)
- [Escalation paths](escalation-paths.md)
- [Platform constitution — versioning](../../CONSTITUTION.md)
