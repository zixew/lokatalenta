-- Migration: Sprint 14 LokaTalenta 3.0 Recruiter Portal, Multi-Tenant Assessment & Shortlist CRM

-- 1. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  brand_color TEXT NOT NULL DEFAULT '#0F766E',
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Organization Members (Recruiter Association)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL DEFAULT 'recruiter' CHECK (member_role IN ('owner', 'admin', 'recruiter', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- 3. Assessment Invitations (Custom Branded Corporate Invites)
CREATE TABLE IF NOT EXISTS public.assessment_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  quiz_title TEXT NOT NULL DEFAULT '',
  target_position TEXT NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Recruiter Shortlists (Talent CRM)
CREATE TABLE IF NOT EXISTS public.recruiter_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(recruiter_id, candidate_id)
);

-- 5. Indexes for fast multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_assessment_invites_token ON public.assessment_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_assessment_invites_org ON public.assessment_invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_shortlists_recruiter ON public.recruiter_shortlists(recruiter_id);

-- 6. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_shortlists ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
DROP POLICY IF EXISTS "Public can view verified organizations" ON public.organizations;
CREATE POLICY "Public can view verified organizations"
  ON public.organizations FOR SELECT
  USING (is_verified = true);

DROP POLICY IF EXISTS "Recruiters and admins can manage their organization" ON public.organizations;
CREATE POLICY "Recruiters and admins can manage their organization"
  ON public.organizations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = public.organizations.id
        AND om.user_id = auth.uid()
    )
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Members can view their organization membership" ON public.organization_members;
CREATE POLICY "Members can view their organization membership"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Public can view active assessment invites by token" ON public.assessment_invitations;
CREATE POLICY "Public can view active assessment invites by token"
  ON public.assessment_invitations FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Recruiters can manage invitations" ON public.assessment_invitations;
CREATE POLICY "Recruiters can manage invitations"
  ON public.assessment_invitations FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'recruiter')
  );

DROP POLICY IF EXISTS "Recruiters can manage their shortlists" ON public.recruiter_shortlists;
CREATE POLICY "Recruiters can manage their shortlists"
  ON public.recruiter_shortlists FOR ALL
  TO authenticated
  USING (
    recruiter_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 8. Grant permissions
GRANT SELECT ON public.organizations TO anon, authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organization_members TO authenticated;
GRANT SELECT ON public.assessment_invitations TO anon, authenticated;
GRANT ALL ON public.assessment_invitations TO authenticated;
GRANT ALL ON public.recruiter_shortlists TO authenticated;
