-- Sync all organizations' total_verifications from actual organization_claims data
UPDATE organizations o
SET total_verifications = (
  SELECT COUNT(*) FROM organization_claims oc 
  WHERE oc.organization_id = o.id 
  AND oc.verification_status = 'verified'
),
updated_at = now();