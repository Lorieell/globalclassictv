-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
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

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update hero_items policies: Remove public write access, add admin-only write
DROP POLICY IF EXISTS "Anyone can insert hero items" ON public.hero_items;
DROP POLICY IF EXISTS "Anyone can update hero items" ON public.hero_items;
DROP POLICY IF EXISTS "Anyone can delete hero items" ON public.hero_items;

CREATE POLICY "Admins can insert hero items"
ON public.hero_items
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hero items"
ON public.hero_items
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hero items"
ON public.hero_items
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update ad_settings policies: Remove public write access, add admin-only write
DROP POLICY IF EXISTS "Anyone can update ad settings" ON public.ad_settings;
DROP POLICY IF EXISTS "Anyone can modify ad settings" ON public.ad_settings;

CREATE POLICY "Admins can insert ad settings"
ON public.ad_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ad settings"
ON public.ad_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ad settings"
ON public.ad_settings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update media policies: Remove public write access, add admin-only write
DROP POLICY IF EXISTS "Anyone can insert media" ON public.media;
DROP POLICY IF EXISTS "Anyone can update media" ON public.media;
DROP POLICY IF EXISTS "Anyone can delete media" ON public.media;

CREATE POLICY "Admins can insert media"
ON public.media
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update media"
ON public.media
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete media"
ON public.media
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));