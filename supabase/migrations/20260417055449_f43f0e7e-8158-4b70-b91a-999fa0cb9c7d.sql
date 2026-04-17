-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'reviewer', 'user');
CREATE TYPE public.trade_type AS ENUM ('electrician', 'plumber', 'welder', 'carpenter', 'ac_tech');
CREATE TYPE public.assessment_status AS ENUM ('pending_review', 'verified', 'needs_rerecord');
CREATE TYPE public.reviewer_mode AS ENUM ('human_only', 'ai_only', 'human_and_ai');
CREATE TYPE public.lang_type AS ENUM ('hi', 'en');

-- ============================================================
-- TIMESTAMP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- USER ROLES (separate table — prevents privilege escalation)
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- WORKERS
-- ============================================================
CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  language public.lang_type NOT NULL DEFAULT 'hi',
  passport_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_workers_passport_slug ON public.workers(passport_slug);

CREATE POLICY "Workers can view their own record"
  ON public.workers FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Public can view workers by slug"
  ON public.workers FOR SELECT
  USING (passport_slug IS NOT NULL);

CREATE POLICY "Workers can insert their own record"
  ON public.workers FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Workers can update their own record"
  ON public.workers FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Reviewers can view all workers"
  ON public.workers FOR SELECT
  USING (public.has_role(auth.uid(), 'reviewer') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- WORKER PROFILES
-- ============================================================
CREATE TABLE public.worker_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL UNIQUE REFERENCES public.workers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  trade public.trade_type NOT NULL,
  experience_years INT NOT NULL DEFAULT 0,
  daily_wage INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view their own profile"
  ON public.worker_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_id AND w.auth_user_id = auth.uid()
  ));

CREATE POLICY "Public can view profiles for slug-published workers"
  ON public.worker_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_id AND w.passport_slug IS NOT NULL
  ));

CREATE POLICY "Workers can insert their own profile"
  ON public.worker_profiles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_id AND w.auth_user_id = auth.uid()
  ));

CREATE POLICY "Workers can update their own profile"
  ON public.worker_profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_id AND w.auth_user_id = auth.uid()
  ));

CREATE POLICY "Reviewers can view all profiles"
  ON public.worker_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'reviewer') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_worker_profiles_updated_at
  BEFORE UPDATE ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ASSESSMENTS
-- ============================================================
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  trade public.trade_type NOT NULL,
  video_url TEXT,
  video_path TEXT,
  status public.assessment_status NOT NULL DEFAULT 'pending_review',
  level INT CHECK (level IS NULL OR (level BETWEEN 1 AND 3)),
  capabilities_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewer_mode public.reviewer_mode NOT NULL DEFAULT 'human_and_ai',
  ai_score_json JSONB,
  human_score_json JSONB,
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_assessments_worker ON public.assessments(worker_id, created_at DESC);
CREATE INDEX idx_assessments_status ON public.assessments(status);

CREATE POLICY "Workers can view their own assessments"
  ON public.assessments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_id AND w.auth_user_id = auth.uid()
  ));

CREATE POLICY "Public can view verified assessments for slug-published workers"
  ON public.assessments FOR SELECT
  USING (
    status = 'verified' AND EXISTS (
      SELECT 1 FROM public.workers w
      WHERE w.id = worker_id AND w.passport_slug IS NOT NULL
    )
  );

CREATE POLICY "Workers can insert their own assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_id AND w.auth_user_id = auth.uid()
  ));

CREATE POLICY "Reviewers can view all assessments"
  ON public.assessments FOR SELECT
  USING (public.has_role(auth.uid(), 'reviewer') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reviewers can update assessments"
  ON public.assessments FOR UPDATE
  USING (public.has_role(auth.uid(), 'reviewer') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- AUTO-CREATE WORKER ROW ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workers (auth_user_id, phone, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    COALESCE((NEW.raw_user_meta_data->>'language')::public.lang_type, 'hi')
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE: assessment videos
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assessment-videos',
  'assessment-videos',
  false,
  104857600, -- 100 MB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
);

CREATE POLICY "Workers can upload their own assessment videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assessment-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Workers can view their own assessment videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assessment-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Reviewers can view all assessment videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assessment-videos'
    AND (public.has_role(auth.uid(), 'reviewer') OR public.has_role(auth.uid(), 'admin'))
  );