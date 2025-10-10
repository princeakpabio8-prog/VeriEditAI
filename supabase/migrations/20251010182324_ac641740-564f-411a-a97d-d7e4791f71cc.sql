-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE,
  logo_url TEXT,
  industry TEXT NOT NULL,
  description TEXT,
  verified_partner BOOLEAN DEFAULT false,
  avg_trust_score NUMERIC DEFAULT 0,
  total_verifications INTEGER DEFAULT 0,
  website TEXT,
  contact_email TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_claims table
CREATE TABLE public.organization_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  verification_id UUID REFERENCES public.verifications(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  trust_score INTEGER,
  confidence_level TEXT,
  verification_status TEXT DEFAULT 'unverified',
  published_at TIMESTAMP WITH TIME ZONE,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create partnership_requests table
CREATE TABLE public.partnership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_website TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_organizations_domain ON public.organizations(domain);
CREATE INDEX idx_organizations_verified_partner ON public.organizations(verified_partner);
CREATE INDEX idx_organization_claims_org_id ON public.organization_claims(organization_id);
CREATE INDEX idx_organization_claims_verification_id ON public.organization_claims(verification_id);
CREATE INDEX idx_partnership_requests_org_id ON public.partnership_requests(organization_id);
CREATE INDEX idx_partnership_requests_status ON public.partnership_requests(status);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations (public read, admin write)
CREATE POLICY "Anyone can view organizations"
  ON public.organizations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage organizations"
  ON public.organizations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for organization_claims (public read, service role write)
CREATE POLICY "Anyone can view organization claims"
  ON public.organization_claims FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage claims"
  ON public.organization_claims FOR ALL
  USING (true);

-- RLS Policies for partnership_requests (users can submit, admins can view all)
CREATE POLICY "Users can submit partnership requests"
  ON public.partnership_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own requests"
  ON public.partnership_requests FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage partnership requests"
  ON public.partnership_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updating updated_at timestamp
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partnership_requests_updated_at
  BEFORE UPDATE ON public.partnership_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();