# Environment Variable Policy Note

**Rule:** NEVER switch to or use production credentials (such as Production Database URLs, API Keys, etc.) in a local development environment without EXPLICIT prior approval from the user.

**Context:** On April 30, 2026, the `DATABASE_URL` in `backend/.env` was modified to point to the production Supabase instance to bypass a local/dev database connection issue. This was a severe violation of environment separation principles.

**Action Required for Future:**
1. Always respect the `.env` (development) and `.env.prod` (production) separation.
2. If the development database is failing or paused, inform the user of the error and ask how they wish to proceed.
3. Do not auto-remedy infrastructure issues by bridging production resources into local environments.
