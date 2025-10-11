-- Create function to backfill source regions based on domain patterns
CREATE OR REPLACE FUNCTION backfill_source_regions()
RETURNS TABLE(
  updated_count INTEGER,
  breakdown JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  region_counts JSONB;
  total_updated INTEGER := 0;
BEGIN
  -- North America (major US outlets + .com, .us, .ca)
  UPDATE sources 
  SET source_region = 'North America'
  WHERE source_region IS NULL 
  AND (
    domain LIKE '%.com' OR domain LIKE '%.us' OR domain LIKE '%.ca'
    OR domain IN (
      'www.reuters.com', 'www.nytimes.com', 'www.cnn.com', 
      'edition.cnn.com', 'us.cnn.com', 'amp.cnn.com',
      'www.npr.org', 'apnews.com', 'www.politifact.com',
      'archive.nytimes.com', 'nytco-assets.nytimes.com',
      'newslink.reuters.com'
    )
  );
  
  GET DIAGNOSTICS total_updated = ROW_COUNT;
  
  -- Europe (.uk, .eu, BBC, Guardian)
  UPDATE sources 
  SET source_region = 'Europe'
  WHERE source_region IS NULL 
  AND (
    domain LIKE '%.uk' OR domain LIKE '%.eu' 
    OR domain LIKE '%.de' OR domain LIKE '%.fr'
    OR domain IN ('www.bbc.com', 'www.theguardian.com')
  );
  
  -- Africa (.ng, .za, .ke, African news)
  UPDATE sources 
  SET source_region = 'Africa'
  WHERE source_region IS NULL 
  AND (
    domain LIKE '%.ng' OR domain LIKE '%.za' OR domain LIKE '%.ke'
    OR domain IN ('cdn.businessday.ng', 'www.completesports.com')
  );
  
  -- Asia Pacific
  UPDATE sources 
  SET source_region = 'Asia Pacific'
  WHERE source_region IS NULL 
  AND (
    domain LIKE '%.jp' OR domain LIKE '%.cn' 
    OR domain LIKE '%.au' OR domain LIKE '%.in'
    OR domain LIKE '%.sg'
  );
  
  -- Latin America
  UPDATE sources 
  SET source_region = 'Latin America'
  WHERE source_region IS NULL 
  AND (domain LIKE '%.br' OR domain LIKE '%.mx' OR domain LIKE '%.ar');
  
  -- Middle East
  UPDATE sources 
  SET source_region = 'Middle East'
  WHERE source_region IS NULL 
  AND (domain LIKE '%.ae' OR domain LIKE '%.sa' OR domain LIKE '%.il');
  
  -- Default: International
  UPDATE sources 
  SET source_region = 'International'
  WHERE source_region IS NULL;
  
  -- Get breakdown by region
  SELECT jsonb_object_agg(source_region, count) INTO region_counts
  FROM (
    SELECT source_region, COUNT(*) as count
    FROM sources
    WHERE source_region IS NOT NULL
    GROUP BY source_region
    ORDER BY count DESC
  ) region_summary;
  
  RETURN QUERY SELECT total_updated, region_counts;
END;
$$;

-- Execute the backfill immediately
SELECT * FROM backfill_source_regions();

-- Clear old analytics with "Unknown" regions so they rebuild correctly
DELETE FROM trust_analytics WHERE region = 'Unknown';

-- Verify results
SELECT source_region, COUNT(*) as count 
FROM sources 
GROUP BY source_region 
ORDER BY count DESC;