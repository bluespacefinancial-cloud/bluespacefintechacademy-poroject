-- Academy API tokens and password-reset tokens. These tables are only
-- reachable through the service_role used by the Laravel backend.
CREATE TABLE IF NOT EXISTS public.auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON public.auth_tokens(user_id);
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_tokens FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auth_tokens TO service_role;

CREATE TABLE IF NOT EXISTS public.password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON public.password_resets(user_id);
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.password_resets FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_resets TO service_role;
