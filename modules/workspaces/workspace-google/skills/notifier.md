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

# notifier (Google Workspace)

## Purpose

Deliver a single, well-shaped notification to the team's primary collaboration channel on
Google Chat, with Gmail as a fallback when Chat is unreachable. The skill is named
`notifier` — identical to the `workspace-microsoft` notifier — so downstream skills and
workflows call `notifier` abstractly without caring which workspace the project selected.

The goal is low-noise, high-signal pings: a human (or agent) sees exactly one message per
meaningful event, shaped so the recipient can decide in under 10 seconds whether to act.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `event_type` | yes | Enum: `gate_approval_needed`, `ci_failure`, `release_merged`, `spec_ready`, `incident`. One enum value per call. |
| `payload` | yes | Object with `title`, `body`, `actor`, `link`, and `severity` (`info` / `warn` / `error`). |
| `mention` | warn | Optional list of Chat user IDs or group aliases. Used only for `severity=error`. |
| `thread_key` | warn | Optional key for coalescing related messages into the same Chat thread. |

## Process

1. **Validate inputs.** Reject calls with missing `event_type` or `payload.title`. Reject
   `event_type` values outside the declared enum. Never silently coerce.
2. **Shape the card.** Render a Google Chat **cardsV2** message (JSON) keyed on `event_type`:
   - `gate_approval_needed` → action buttons linking to the PR / review URL
   - `ci_failure` → summary of failing job, link to logs, short blame hint
   - `release_merged` → release notes snippet, link to CHANGELOG
   - `spec_ready` → link to spec.md, requested reviewers
   - `incident` → severity, incident channel link, on-call handle
3. **Post.** Call the Google Chat MCP server with the `chat_space_id` configured at `agentic
   init`. Capture the returned message name as `notification_id`.
4. **Fallback.** If Chat returns non-2xx, retry once with jitter. On second failure, send
   a Gmail message to the `primary_channel_name` group alias with the same title + body +
   link, prefixed `[chat-fallback]`. The Gmail message ID becomes `notification_id`.
5. **Deduplicate.** If `thread_key` is set, post into the existing Chat thread via
   `threadKey` instead of starting a new one. Gmail fallback uses the same subject line to
   thread in most clients.
6. **Record.** Return the `notification_id` and the path taken (`chat` | `gmail-fallback`).

## Outputs

- `notification_id` (string): Chat message name (`spaces/.../messages/...`), or Gmail
  message ID if the fallback fired.
- Implicit: a side-effect message visible in the channel within ~2 seconds under normal load.

## Acceptance

- Posting a `gate_approval_needed` event renders a cardsV2 message with at least one button
  whose `onClick.openLink.url` matches `payload.link`.
- `ci_failure` and `incident` events with `severity=error` and `mention` set include the
  mentions as `@` user annotations in the card text.
- When the Chat space is temporarily unreachable (simulate 503), the skill returns a
  non-null `notification_id` sourced from Gmail and flags `path=gmail-fallback`.
- Two calls with the same `thread_key` produce replies in a single Chat thread (verified by
  `thread.name` equality on the second call).
- Invalid `event_type` values cause the skill to fail fast with a clear error and never post.

## Common failure modes

- **OAuth token expired.** Chat tokens rotate; the fallback path exists precisely for this
  case. Surface the rotation need in the returned error detail.
- **Card too large.** Google Chat caps cardsV2 payload (~32 KB). Truncate `payload.body` to
  4 KB and link out to the full content rather than inlining everything.
- **Mentions mis-resolve.** User annotations require the user to be a space member; if a
  mention fails, post anyway and attach a note to the returned detail — do not swallow.
- **Gmail fallback spam.** If Chat is failing for every call, the fallback turns into an
  email flood. Circuit-break after 3 consecutive fallbacks in 5 minutes and emit a single
  `incident` event to the configured on-call alias instead.
- **Clock skew on `thread_key`.** If two producers race the same `thread_key`, Chat may
  create two threads. Treat thread_key as a hint, not a guarantee.
