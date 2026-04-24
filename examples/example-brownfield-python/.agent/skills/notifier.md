---
name: notifier
version: 0.1.0
tier: workspace
description: Post notifications to the team's primary collaboration channel.
when_to_use: |
  - Gate approvals need to reach the team
  - CI failure requires human attention
  - Feature merged to release branch
when_not_to_use: |
  - Low-signal events (noise)
  - Cross-organization broadcasts (use official comms channels)
inputs:
  - event_type: string (enum)
  - payload: object
outputs:
  - notification_id: string
requires_profiles: [builder, verifier, steward]
---

# notifier (Microsoft 365)

## Purpose

Deliver a single, well-shaped notification to the team's primary collaboration channel on
Microsoft Teams, with Outlook email as a fallback when Teams is unreachable. The skill is
named `notifier` — identical to the `workspace-google` notifier — so downstream skills and
workflows call `notifier` abstractly without caring which workspace the project selected.

The goal is low-noise, high-signal pings: a human (or agent) sees exactly one message per
meaningful event, shaped so the recipient can decide in under 10 seconds whether to act.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `event_type` | yes | Enum: `gate_approval_needed`, `ci_failure`, `release_merged`, `spec_ready`, `incident`. One enum value per call. |
| `payload` | yes | Object with `title`, `body`, `actor`, `link`, and `severity` (`info` / `warn` / `error`). |
| `mention` | warn | Optional list of Teams `@` handles or channel-group aliases. Used only for `severity=error`. |
| `thread_key` | warn | Optional key for coalescing related messages into the same Teams thread. |

## Process

1. **Validate inputs.** Reject calls with missing `event_type` or `payload.title`. Reject
   `event_type` values outside the declared enum. Never silently coerce.
2. **Shape the card.** Render an MS Teams **adaptive card** (JSON) keyed on `event_type`:
   - `gate_approval_needed` → action buttons linking to the PR / review URL
   - `ci_failure` → summary of failing job, link to logs, short blame hint
   - `release_merged` → release notes snippet, link to CHANGELOG
   - `spec_ready` → link to spec.md, requested reviewers
   - `incident` → severity, incident channel link, on-call handle
3. **Post.** Call the Teams MCP server with the `teams_webhook_url` configured at `agentic
   init`. Capture the returned message ID as `notification_id`.
4. **Fallback.** If Teams returns non-2xx, retry once with jitter. On second failure, send
   an Outlook email to `primary_channel_id`'s subscriber list with the same title + body +
   link, prefixed `[teams-fallback]`. The Outlook message ID becomes `notification_id`.
5. **Deduplicate.** If `thread_key` is set, append to the existing Teams thread instead of
   starting a new one. Outlook fallback uses the same subject line to thread in most clients.
6. **Record.** Return the `notification_id` and the path taken (`teams` | `outlook-fallback`).

## Outputs

- `notification_id` (string): Teams message ID, or Outlook message ID if the fallback fired.
- Implicit: a side-effect message visible in the channel within ~2 seconds under normal load.

## Acceptance

- Posting a `gate_approval_needed` event renders an adaptive card with at least one action
  button whose URL matches `payload.link`.
- `ci_failure` and `incident` events with `severity=error` and `mention` set include the
  mentions in the card's `msteams.entities` block.
- When the Teams webhook is temporarily unreachable (simulate 503), the skill returns a
  non-null `notification_id` sourced from Outlook and flags `path=outlook-fallback`.
- Two calls with the same `thread_key` produce replies in a single Teams thread (verified
  by `replyToId` metadata on the second call).
- Invalid `event_type` values cause the skill to fail fast with a clear error and never post.

## Common failure modes

- **Webhook expired.** Teams incoming webhooks rotate; the fallback path exists precisely
  for this case. Surface the rotation need in the returned error detail.
- **Card too large.** Teams hard-caps adaptive card size (~28 KB). Truncate `payload.body`
  to 4 KB and link out to the full content rather than inlining everything.
- **Mentions mis-resolve.** `@channel` and `@team` resolution depends on tenant config; if
  a mention fails, post anyway and attach a note to the returned detail — do not swallow.
- **Outlook fallback spam.** If Teams is failing for every call, the fallback turns into
  an email flood. Circuit-break after 3 consecutive fallbacks in 5 minutes and emit a
  single `incident` event to the configured on-call alias instead.
- **Clock skew on `thread_key`.** If two producers race the same `thread_key`, Teams may
  create two threads. Treat thread_key as a hint, not a guarantee.
