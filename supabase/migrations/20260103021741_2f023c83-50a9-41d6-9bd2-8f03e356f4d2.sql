-- Create enum for media types
CREATE TYPE public.media_type AS ENUM ('film', 'serie');

-- Create media table
CREATE TABLE public.media (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tmdb_id INTEGER,
    title TEXT NOT NULL,
    original_title TEXT,
    description TEXT,
    type media_type NOT NULL DEFAULT 'film',
    poster_url TEXT,
    backdrop_url TEXT,
    video_urls TEXT[] DEFAULT '{}',
    year TEXT,
    rating NUMERIC(3,1),
    duration TEXT,
    genres TEXT[] DEFAULT '{}',
    cast_members TEXT[] DEFAULT '{}',
    director TEXT,
    quality TEXT DEFAULT 'HD',
    language TEXT DEFAULT 'VF',
    is_new BOOLEAN DEFAULT false,
    seasons JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hero_items table for featured content
CREATE TABLE public.hero_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    image_url TEXT,
    video_url TEXT,
    button_text TEXT DEFAULT 'Regarder',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create watchlist table (user-specific)
CREATE TABLE public.watchlist (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    session_id TEXT,
    media_id UUID REFERENCES public.media(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, media_id),
    UNIQUE(session_id, media_id)
);

-- Create favorites table (user-specific)
CREATE TABLE public.favorites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    session_id TEXT,
    media_id UUID REFERENCES public.media(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, media_id),
    UNIQUE(session_id, media_id)
);

-- Create watch_progress table for resume playback
CREATE TABLE public.watch_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    session_id TEXT,
    media_id UUID REFERENCES public.media(id) ON DELETE CASCADE NOT NULL,
    progress NUMERIC(5,2) DEFAULT 0,
    season_id TEXT,
    episode_id TEXT,
    last_watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, media_id),
    UNIQUE(session_id, media_id)
);

-- Create seen table (user-specific)
CREATE TABLE public.seen (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    session_id TEXT,
    media_id UUID REFERENCES public.media(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, media_id),
    UNIQUE(session_id, media_id)
);

-- Create ad_settings table for global ad configuration
CREATE TABLE public.ad_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

-- Media: Public read, admin write (for now, public write for admin)
CREATE POLICY "Anyone can view media" ON public.media FOR SELECT USING (true);
CREATE POLICY "Anyone can insert media" ON public.media FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update media" ON public.media FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete media" ON public.media FOR DELETE USING (true);

-- Hero items: Public read, admin write
CREATE POLICY "Anyone can view hero items" ON public.hero_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert hero items" ON public.hero_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update hero items" ON public.hero_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete hero items" ON public.hero_items FOR DELETE USING (true);

-- Watchlist: Users manage their own
CREATE POLICY "Users can view their watchlist" ON public.watchlist FOR SELECT USING (true);
CREATE POLICY "Users can add to watchlist" ON public.watchlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can remove from watchlist" ON public.watchlist FOR DELETE USING (true);

-- Favorites: Users manage their own
CREATE POLICY "Users can view their favorites" ON public.favorites FOR SELECT USING (true);
CREATE POLICY "Users can add to favorites" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can remove from favorites" ON public.favorites FOR DELETE USING (true);

-- Watch progress: Users manage their own
CREATE POLICY "Users can view their progress" ON public.watch_progress FOR SELECT USING (true);
CREATE POLICY "Users can update their progress" ON public.watch_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can modify their progress" ON public.watch_progress FOR UPDATE USING (true);
CREATE POLICY "Users can delete their progress" ON public.watch_progress FOR DELETE USING (true);

-- Seen: Users manage their own
CREATE POLICY "Users can view their seen" ON public.seen FOR SELECT USING (true);
CREATE POLICY "Users can add to seen" ON public.seen FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can remove from seen" ON public.seen FOR DELETE USING (true);

-- Ad settings: Public read, admin write
CREATE POLICY "Anyone can view ad settings" ON public.ad_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can update ad settings" ON public.ad_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can modify ad settings" ON public.ad_settings FOR UPDATE USING (true);

-- Enable realtime for media and hero_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.media;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_settings;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_media_updated_at
    BEFORE UPDATE ON public.media
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hero_items_updated_at
    BEFORE UPDATE ON public.hero_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_settings_updated_at
    BEFORE UPDATE ON public.ad_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default ad settings
INSERT INTO public.ad_settings (settings) VALUES ('{}');