-- Function to automatically create subscriber record for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscriber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into subscribers table
  INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    true,
    'free'
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicates if record already exists
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user signup
    RAISE WARNING 'Failed to create subscriber record: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger to auto-create subscriber on user signup
CREATE TRIGGER on_auth_user_created_subscriber
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscriber();