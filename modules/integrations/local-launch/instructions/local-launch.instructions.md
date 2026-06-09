---
description: "Use when adding or editing local launch tasks, OS-specific env overlays, Okta local auth settings, or developer startup scripts."
applyTo: ".vscode/**,**/.env.example,**/*launch*,**/*startup*,**/*dev*.sh,**/*dev*.ps1"
---

# Local Launch Instructions

- Keep local launch scripts cross-platform: provide macOS/Linux shell and Windows PowerShell variants when commands differ.
- Load shared env first, then OS-specific overlays, then process env.
- Keep auth bypass local-only and visibly named, for example `MORPHEUS_LOCAL_AUTH_MODE=mock`.
- Do not alter production auth configuration from local launch scripts.
- Never commit `.env`, tokens, cookies, client secrets, or generated credential files.
- Prefer existing repo `README`, `package.json`, `pyproject.toml`, or startup scripts over invented launch commands.
