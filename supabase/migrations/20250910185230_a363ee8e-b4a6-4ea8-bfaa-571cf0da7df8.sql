-- Give admin role to your user account
INSERT INTO public.user_roles (user_id, role) 
VALUES ('e5a8854f-9bc2-444e-acac-efef13e7e8bf', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;