# SEEK Project — Copilot Instructions

## Project Overview
Two-repo monorepo workspace for McKesson Government RFP (SEEK) application:
- **Backend**: `mms-daaa-gov-rfp-web-backend/` — Flask/Python REST API on port 8080
- **Frontend**: `mms-daaa-gov-rfp-web-frontend/` — React/Vite/TypeScript on port 8000

## Working Branch
Both repos use branch `DAAA-9999`. All work happens here.

## Local Dev Mode
- Controlled by `MAC_LOCAL_DEV=true` in `SEEK/.env`
- Backend: Sets `DISABLE_OKTA=ON` → `okta_token_required` decorator bypasses token verification
- Frontend: Sets `VITE_MOCK_AUTH=true` → mock auth provider simulates authenticated user
- Dev user identity configured via `DEV_USER_*` env vars in `SEEK/.env`

## Key Architecture
### Backend
- Flask app entry: `app/app.py`
- Auth decorator: `app/services/okta_auth.py` → `okta_token_required`
- User profile endpoint: `app/routes/auth_routes.py` → `/api/auth/me`
- Settings: `app/config/settings.py` → Pydantic `Settings` class
- CORS: `app/helpers/cors_conf.py`
- DB: Azure SQL via pyodbc

### Frontend
- Entry: `src/main.tsx` → `src/App.tsx`
- Auth config: `src/auth/authConfig.ts` (has built-in mock mode)
- Auth provider: `src/auth/AuthProvider.tsx`
- Auth hook: `src/auth/useAuth.ts`
- Routing: `src/components/AppRoutes.tsx`, guarded by `src/auth/SecureRoute.tsx`
- API constants: `src/constants/index.ts`
- State: React Query (`@tanstack/react-query`)

## Commit Conventions
Follow conventional commits: `type(scope): description`
- Max 72 char subject line
- Types: feat, fix, refactor, docs, style, test, chore

## Production Safety
- Never commit `.env` files
- All dev-mode bypasses are gated on env vars that don't exist in production
- Before committing, verify no hardcoded secrets or debug statements
- Keep changes scoped — don't modify production auth flow
