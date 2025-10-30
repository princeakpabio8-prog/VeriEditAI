-- Fix security linter warnings by adding search_path to functions

-- Fix calculate_service_fee function
CREATE OR REPLACE FUNCTION calculate_service_fee(reward_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 7.5% service fee (between 5-10%)
  RETURN ROUND(reward_amount * 0.075, 2);
END;
$$;