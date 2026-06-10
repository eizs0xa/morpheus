# Local Launch

This module helps teams launch applications locally across macOS and Windows.

## Skill Sequence

1. `local-launch` - inspects repo startup docs and creates launch guidance.

## Outputs

- local launch notes
- OS-specific launch commands or tasks
- `.env.example` entries for local launch variables

## Notes

Local launch should make Okta/mock auth and OS environment differences explicit. It should never weaken production auth or store secrets.