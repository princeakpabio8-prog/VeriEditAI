-- Update organizations total_verifications from actual organization_claims data
UPDATE organizations o
SET total_verifications = COALESCE(
  (SELECT COUNT(*) FROM organization_claims oc 
   WHERE oc.organization_id = o.id 
   AND oc.verification_status = 'verified'),
  0
),
updated_at = now();

-- Clean HTML from description fields (strip img tags and other HTML)
UPDATE organizations
SET description = regexp_replace(
  regexp_replace(description, '<[^>]+>', '', 'gi'),
  '&[^;]+;', '', 'gi'
)
WHERE description LIKE '%<%';

-- Create a trigger function to auto-update organization verification counts
CREATE OR REPLACE FUNCTION update_organization_verification_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE organizations
    SET total_verifications = (
      SELECT COUNT(*) FROM organization_claims
      WHERE organization_id = NEW.organization_id
      AND verification_status = 'verified'
    ),
    updated_at = now()
    WHERE id = NEW.organization_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE organizations
    SET total_verifications = (
      SELECT COUNT(*) FROM organization_claims
      WHERE organization_id = OLD.organization_id
      AND verification_status = 'verified'
    ),
    updated_at = now()
    WHERE id = OLD.organization_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_org_verification_count ON organization_claims;
CREATE TRIGGER update_org_verification_count
AFTER INSERT OR UPDATE OR DELETE ON organization_claims
FOR EACH ROW
EXECUTE FUNCTION update_organization_verification_count();