-- 1. Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'medical_staff', 'user');

-- 2. Create user_roles table (roles stored separately per security guidelines)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for user_roles (users can view their own roles)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Drop existing overly permissive policies on patients table
DROP POLICY IF EXISTS "Anyone can view patient records" ON public.patients;
DROP POLICY IF EXISTS "Anyone can create patient records" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patient records" ON public.patients;

-- 7. Create new restrictive policies using role-based access

-- SELECT: Only medical staff can view patient records
CREATE POLICY "Only medical staff can view patients"
ON public.patients
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'medical_staff') OR public.has_role(auth.uid(), 'admin'));

-- INSERT: No direct inserts allowed (Edge Function uses service role key)
-- This prevents anyone from bypassing validation by inserting directly

-- UPDATE: Only medical staff can update patient records
CREATE POLICY "Only medical staff can update patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'medical_staff') OR public.has_role(auth.uid(), 'admin'));

-- 8. Create function to auto-assign medical_staff role on doctor signup
-- This will be called via trigger when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_medical_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Auto-assign medical_staff role to new users
    -- In production, you might want an admin approval workflow instead
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'medical_staff');
    RETURN NEW;
END;
$$;

-- 9. Create trigger to auto-assign role on user creation
CREATE TRIGGER on_auth_user_created_assign_role
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_medical_staff();