-- 1) Add 'employer' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employer';

-- 2) employer_profiles table
CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  city TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view their own profile"
  ON public.employer_profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Employers can insert their own profile"
  ON public.employer_profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Employers can update their own profile"
  ON public.employer_profiles FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE TRIGGER employer_profiles_updated_at
  BEFORE UPDATE ON public.employer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) job_posts table
CREATE TABLE IF NOT EXISTS public.job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
  trade public.trade_type NOT NULL,
  city TEXT NOT NULL,
  title TEXT NOT NULL,
  wage_offered INT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

-- Public can view open jobs (helps workers/discovery later)
CREATE POLICY "Public can view open job posts"
  ON public.job_posts FOR SELECT
  USING (status = 'open');

CREATE POLICY "Employers can view their own jobs"
  ON public.job_posts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.employer_profiles ep
    WHERE ep.id = job_posts.employer_id AND ep.auth_user_id = auth.uid()
  ));

CREATE POLICY "Employers can insert their own jobs"
  ON public.job_posts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.employer_profiles ep
    WHERE ep.id = job_posts.employer_id AND ep.auth_user_id = auth.uid()
  ));

CREATE POLICY "Employers can update their own jobs"
  ON public.job_posts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.employer_profiles ep
    WHERE ep.id = job_posts.employer_id AND ep.auth_user_id = auth.uid()
  ));

CREATE POLICY "Employers can delete their own jobs"
  ON public.job_posts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.employer_profiles ep
    WHERE ep.id = job_posts.employer_id AND ep.auth_user_id = auth.uid()
  ));

CREATE TRIGGER job_posts_updated_at
  BEFORE UPDATE ON public.job_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_job_posts_employer ON public.job_posts(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_trade_city ON public.job_posts(trade, city);

-- 4) employer_actions: track Call/WhatsApp/Hire on workers
CREATE TABLE IF NOT EXISTS public.employer_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view','call','whatsapp','hire')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employer_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view their own actions"
  ON public.employer_actions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.employer_profiles ep
    WHERE ep.id = employer_actions.employer_id AND ep.auth_user_id = auth.uid()
  ));

CREATE POLICY "Employers can insert their own actions"
  ON public.employer_actions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.employer_profiles ep
    WHERE ep.id = employer_actions.employer_id AND ep.auth_user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_employer_actions_employer ON public.employer_actions(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_actions_worker ON public.employer_actions(worker_id);