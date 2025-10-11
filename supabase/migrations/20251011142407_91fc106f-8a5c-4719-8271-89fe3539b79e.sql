-- Create batch function for source reputation scoring
CREATE OR REPLACE FUNCTION public.get_adjusted_source_scores_batch(
  _domains text[],
  _base_scores integer[]
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_array jsonb := '[]'::jsonb;
  domain_value text;
  base_score_value integer;
  adjusted_score integer;
  i integer;
BEGIN
  -- Validate inputs have same length
  IF array_length(_domains, 1) != array_length(_base_scores, 1) THEN
    RAISE EXCEPTION 'Domain and base score arrays must have same length';
  END IF;
  
  -- Process each domain-score pair
  FOR i IN 1..array_length(_domains, 1) LOOP
    domain_value := _domains[i];
    base_score_value := _base_scores[i];
    
    -- Get adjusted score using existing function logic
    adjusted_score := public.get_adjusted_source_score(domain_value, base_score_value);
    
    -- Add to result array
    result_array := result_array || jsonb_build_object(
      'domain', domain_value,
      'base_score', base_score_value,
      'adjusted_score', adjusted_score
    );
  END LOOP;
  
  RETURN result_array;
END;
$function$;