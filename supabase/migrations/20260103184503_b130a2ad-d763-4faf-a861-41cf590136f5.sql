-- Ajouter la colonne duration aux hero_items pour permettre une durée personnalisée par slide
ALTER TABLE public.hero_items 
ADD COLUMN duration integer DEFAULT 30;