-- Create license types enum
CREATE TYPE public.license_type AS ENUM ('trial', 'basic', 'professional', 'enterprise');

-- Create license status enum  
CREATE TYPE public.license_status AS ENUM ('active', 'expired', 'suspended', 'revoked');

-- Create licenses table
CREATE TABLE public.licenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    license_key TEXT NOT NULL UNIQUE,
    license_type public.license_type NOT NULL DEFAULT 'trial',
    status public.license_status NOT NULL DEFAULT 'active',
    features JSONB NOT NULL DEFAULT '{}',
    max_usage INTEGER,
    current_usage INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Create policies for licenses
CREATE POLICY "Users can view their own licenses" 
ON public.licenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own license usage" 
ON public.licenses 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to generate license keys
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT upper(
    substr(gen_random_uuid()::text, 1, 8) || '-' ||
    substr(gen_random_uuid()::text, 1, 4) || '-' ||
    substr(gen_random_uuid()::text, 1, 4) || '-' ||
    substr(gen_random_uuid()::text, 1, 12)
  );
$$;

-- Create function to validate license
CREATE OR REPLACE FUNCTION public.validate_license(user_uuid UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'valid', true,
        'license_type', license_type,
        'status', status,
        'features', features,
        'max_usage', max_usage,
        'current_usage', current_usage,
        'expires_at', expires_at
      )
      FROM public.licenses 
      WHERE user_id = user_uuid 
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY created_at DESC
      LIMIT 1
    ),
    jsonb_build_object('valid', false, 'reason', 'no_valid_license')
  );
$$;

-- Create function to check feature access
CREATE OR REPLACE FUNCTION public.check_feature_access(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT CASE 
        WHEN features ? feature_name THEN (features ->> feature_name)::boolean
        ELSE false
      END
      FROM public.licenses 
      WHERE user_id = user_uuid 
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY created_at DESC
      LIMIT 1
    ),
    false
  );
$$;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION public.increment_license_usage(user_uuid UUID, amount INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  license_rec RECORD;
  new_usage INTEGER;
BEGIN
  -- Get current license
  SELECT * INTO license_rec
  FROM public.licenses 
  WHERE user_id = user_uuid 
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_valid_license');
  END IF;
  
  -- Check if usage would exceed limit
  new_usage := license_rec.current_usage + amount;
  IF license_rec.max_usage IS NOT NULL AND new_usage > license_rec.max_usage THEN
    RETURN jsonb_build_object('success', false, 'error', 'usage_limit_exceeded', 'limit', license_rec.max_usage);
  END IF;
  
  -- Update usage
  UPDATE public.licenses 
  SET current_usage = new_usage,
      updated_at = now()
  WHERE id = license_rec.id;
  
  RETURN jsonb_build_object('success', true, 'new_usage', new_usage, 'limit', license_rec.max_usage);
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_licenses_updated_at
BEFORE UPDATE ON public.licenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create default trial licenses for existing users
INSERT INTO public.licenses (user_id, license_key, license_type, features, max_usage, expires_at)
SELECT 
  id,
  public.generate_license_key(),
  'trial',
  jsonb_build_object(
    'verification', true,
    'bulk_verification', false,
    'api_access', false,
    'premium_analysis', false,
    'export_reports', false
  ),
  20, -- 20 verifications for trial
  now() + interval '30 days'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.licenses);