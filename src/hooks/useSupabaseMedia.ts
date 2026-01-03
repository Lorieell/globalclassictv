import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Media, HeroItem } from '@/types/media';

// Generate a unique session ID for anonymous users
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('gctv-session-id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('gctv-session-id', sessionId);
  }
  return sessionId;
};

// Determine content type based on genres
const determineContentType = (dbMedia: any): 'Film' | 'Série' | 'Animé' | 'Émission' | 'Documentaire' => {
  const genres = dbMedia.genres || [];
  const genresLower = genres.map((g: string) => g.toLowerCase());
  
  // Check for anime
  if (genresLower.some((g: string) => g.includes('anim') || g.includes('anime'))) {
    return 'Animé';
  }
  
  // Check for documentary
  if (genresLower.some((g: string) => g.includes('document'))) {
    return 'Documentaire';
  }
  
  // Check for TV show / émission
  if (genresLower.some((g: string) => 
    g.includes('talk') || g.includes('reality') || g.includes('émission') || 
    g.includes('game show') || g.includes('news')
  )) {
    return 'Émission';
  }
  
  // Default based on original type
  return dbMedia.type === 'film' ? 'Film' : 'Série';
};

// Transform database media to app Media type
const transformDbMedia = (dbMedia: any): Media => {
  const contentType = determineContentType(dbMedia);
  
  const media: Media = {
    id: dbMedia.id,
    title: dbMedia.title,
    image: dbMedia.poster_url || '',
    type: contentType,
    description: dbMedia.description || '',
    synopsis: dbMedia.description || '',
    genres: dbMedia.genres?.join(', ') || '',
    quality: dbMedia.quality || 'HD',
    language: dbMedia.language || 'VF',
    videoUrls: dbMedia.video_urls?.[0] || '',
    trailerUrl: dbMedia.video_urls?.[1] || '', // Second URL as trailer
    seasons: dbMedia.seasons || [],
    director: dbMedia.director || '',
    actors: dbMedia.cast_members?.join(', ') || '',
    tmdbId: dbMedia.tmdb_id,
    updatedAt: new Date(dbMedia.updated_at).getTime(),
    createdAt: new Date(dbMedia.created_at).getTime(),
    popularity: (dbMedia as any).rating || 0,
  };
  // Add extra properties that might not be in the type
  (media as any).backdrop = dbMedia.backdrop_url;
  (media as any).rating = dbMedia.rating;
  (media as any).year = dbMedia.year;
  return media;
};

// Transform app Media to database format
const transformToDbMedia = (media: Partial<Media>) => {
  // Map app types back to DB types (only 'film' and 'serie' exist in DB)
  const dbType = media.type === 'Film' ? 'film' : 'serie';
  
  return {
    title: media.title,
    description: media.description || media.synopsis,
    type: dbType,
    poster_url: media.image,
    backdrop_url: (media as any).backdrop || null,
    video_urls: media.videoUrls ? [media.videoUrls, media.trailerUrl].filter(Boolean) : [],
    genres: media.genres?.split(',').map(g => g.trim()).filter(Boolean) || [],
    quality: media.quality || 'HD',
    language: media.language || 'VF',
    director: media.director || null,
    cast_members: media.actors?.split(',').map(a => a.trim()).filter(Boolean) || [],
    tmdb_id: media.tmdbId || null,
    rating: (media as any).rating || media.popularity || null,
    year: (media as any).year || null,
    seasons: JSON.parse(JSON.stringify(media.seasons || [])),
  };
};

// Transform database hero item to app HeroItem type
const transformDbHeroItem = (dbHero: any): HeroItem => ({
  id: dbHero.id,
  title: dbHero.title,
  description: dbHero.description || '',
  image: dbHero.image_url || '',
  mediaId: dbHero.media_id || '',
  duration: dbHero.duration || 30,
});

export const useSupabaseMedia = () => {
  const [library, setLibrary] = useState<Media[]>([]);
  const [heroItems, setHeroItems] = useState<HeroItem[]>([]);
  const [watchProgress, setWatchProgress] = useState<Record<string, number>>({});
  const [watchPosition, setWatchPosition] = useState<Record<string, { seasonId?: string; episodeId?: string }>>({});
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const sessionId = getSessionId();

  // Fetch all media from database
  const fetchMedia = useCallback(async () => {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media:', error);
      return;
    }

    setLibrary((data || []).map(transformDbMedia));
  }, []);

  // Fetch hero items from database
  const fetchHeroItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('hero_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching hero items:', error);
      return;
    }

    setHeroItems((data || []).map(transformDbHeroItem));
  }, []);

  // Fetch user-specific data (watchlist, favorites, progress, seen)
  const fetchUserData = useCallback(async () => {
    // Fetch watchlist
    const { data: watchlistData } = await supabase
      .from('watchlist')
      .select('media_id')
      .eq('session_id', sessionId);
    setWatchlist((watchlistData || []).map(w => w.media_id));

    // Fetch favorites
    const { data: favoritesData } = await supabase
      .from('favorites')
      .select('media_id')
      .eq('session_id', sessionId);
    setFavorites((favoritesData || []).map(f => f.media_id));

    // Fetch seen
    const { data: seenData } = await supabase
      .from('seen')
      .select('media_id')
      .eq('session_id', sessionId);
    setSeen((seenData || []).map(s => s.media_id));

    // Fetch watch progress
    const { data: progressData } = await supabase
      .from('watch_progress')
      .select('media_id, progress, season_id, episode_id')
      .eq('session_id', sessionId);
    
    const progressMap: Record<string, number> = {};
    const positionMap: Record<string, { seasonId?: string; episodeId?: string }> = {};
    
    (progressData || []).forEach(p => {
      progressMap[p.media_id] = Number(p.progress);
      if (p.season_id || p.episode_id) {
        positionMap[p.media_id] = { seasonId: p.season_id || undefined, episodeId: p.episode_id || undefined };
      }
    });
    
    setWatchProgress(progressMap);
    setWatchPosition(positionMap);
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMedia(), fetchHeroItems(), fetchUserData()]);
      setLoading(false);
    };
    loadData();
  }, [fetchMedia, fetchHeroItems, fetchUserData]);

  // Subscribe to realtime changes for media
  useEffect(() => {
    const channel = supabase
      .channel('media-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media' }, () => {
        fetchMedia();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hero_items' }, () => {
        fetchHeroItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMedia, fetchHeroItems]);

  // Add media to database
  const addMedia = useCallback(async (media: Omit<Media, 'id'> | Media, isManual: boolean = false) => {
    const dbMedia = transformToDbMedia(media) as any;
    
    const { data, error } = await supabase
      .from('media')
      .insert(dbMedia)
      .select()
      .single();

    if (error) {
      console.error('Error adding media:', error);
      throw error;
    }

    const newMedia = transformDbMedia(data);
    setLibrary(prev => [newMedia, ...prev]);
    return newMedia;
  }, []);

  // Update media in database
  const updateMedia = useCallback(async (id: string, updates: Partial<Media>) => {
    const dbUpdates = transformToDbMedia(updates) as any;

    const { error } = await supabase
      .from('media')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating media:', error);
      throw error;
    }

    setLibrary(prev => prev.map(m => m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m));
  }, []);

  // Delete media from database
  const deleteMedia = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting media:', error);
      throw error;
    }

    setLibrary(prev => prev.filter(m => m.id !== id));
  }, []);

  // Save hero items
  const saveHeroItems = useCallback(async (items: HeroItem[]) => {
    // Delete all existing hero items
    await supabase.from('hero_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new items
    const dbItems = items.map((item, index) => ({
      media_id: item.mediaId || null,
      title: item.title,
      description: item.description,
      image_url: item.image,
      sort_order: index,
      is_active: true,
      duration: item.duration || 30,
    }));

    if (dbItems.length > 0) {
      const { error } = await supabase.from('hero_items').insert(dbItems);
      if (error) {
        console.error('Error saving hero items:', error);
        throw error;
      }
    }

    setHeroItems(items);
  }, []);

  // Update watch progress
  const updateProgress = useCallback(async (mediaId: string, progress: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    
    const { error } = await supabase
      .from('watch_progress')
      .upsert({
        session_id: sessionId,
        media_id: mediaId,
        progress: clamped,
        last_watched_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id,media_id',
      });

    if (error) {
      console.error('Error updating progress:', error);
    }

    setWatchProgress(prev => ({ ...prev, [mediaId]: clamped }));
  }, [sessionId]);

  // Update watch position (for series)
  const updatePosition = useCallback(async (mediaId: string, seasonId?: string, episodeId?: string) => {
    const { error } = await supabase
      .from('watch_progress')
      .upsert({
        session_id: sessionId,
        media_id: mediaId,
        season_id: seasonId,
        episode_id: episodeId,
        last_watched_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id,media_id',
      });

    if (error) {
      console.error('Error updating position:', error);
    }

    setWatchPosition(prev => ({ ...prev, [mediaId]: { seasonId, episodeId } }));
  }, [sessionId]);

  // Toggle watchlist
  const toggleWatchlist = useCallback(async (mediaId: string) => {
    const isInList = watchlist.includes(mediaId);

    if (isInList) {
      await supabase
        .from('watchlist')
        .delete()
        .eq('session_id', sessionId)
        .eq('media_id', mediaId);
      setWatchlist(prev => prev.filter(id => id !== mediaId));
    } else {
      await supabase
        .from('watchlist')
        .insert({ session_id: sessionId, media_id: mediaId });
      setWatchlist(prev => [...prev, mediaId]);
    }
  }, [sessionId, watchlist]);

  const isInWatchlist = useCallback((mediaId: string) => watchlist.includes(mediaId), [watchlist]);

  // Toggle favorites
  const toggleFavorite = useCallback(async (mediaId: string) => {
    const isInList = favorites.includes(mediaId);

    if (isInList) {
      await supabase
        .from('favorites')
        .delete()
        .eq('session_id', sessionId)
        .eq('media_id', mediaId);
      setFavorites(prev => prev.filter(id => id !== mediaId));
    } else {
      await supabase
        .from('favorites')
        .insert({ session_id: sessionId, media_id: mediaId });
      setFavorites(prev => [...prev, mediaId]);
    }
  }, [sessionId, favorites]);

  const isInFavorites = useCallback((mediaId: string) => favorites.includes(mediaId), [favorites]);

  // Toggle seen
  const toggleSeen = useCallback(async (mediaId: string) => {
    const isInList = seen.includes(mediaId);

    if (isInList) {
      await supabase
        .from('seen')
        .delete()
        .eq('session_id', sessionId)
        .eq('media_id', mediaId);
      setSeen(prev => prev.filter(id => id !== mediaId));
    } else {
      await supabase
        .from('seen')
        .insert({ session_id: sessionId, media_id: mediaId });
      setSeen(prev => [...prev, mediaId]);
    }
  }, [sessionId, seen]);

  const isSeen = useCallback((mediaId: string) => seen.includes(mediaId), [seen]);

  // Computed values
  const films = useMemo(() => library.filter(m => m.type === 'Film'), [library]);
  const series = useMemo(() => library.filter(m => m.type === 'Série'), [library]);
  const animes = useMemo(() => library.filter(m => m.type === 'Animé'), [library]);
  const emissions = useMemo(() => library.filter(m => m.type === 'Émission'), [library]);
  const documentaries = useMemo(() => library.filter(m => m.type === 'Documentaire'), [library]);
  
  // Current year for filtering recent vs classic content
  const currentYear = new Date().getFullYear();
  const recentThreshold = currentYear - 2; // Films from last 2 years are "recent/popular"
  const classicThreshold = currentYear - 10; // Films older than 10 years are "classics"
  
  // Helper: Check if title is mainstream (latin characters, no CJK/Korean scripts)
  const isMainstreamTitle = (title: string): boolean => {
    // Regex to detect CJK (Chinese, Japanese, Korean) characters
    const cjkPattern = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/;
    return !cjkPattern.test(title);
  };
  
  // Recent popular films (last 2 years, mainstream titles, sorted by popularity)
  const popularFilms = useMemo(() => {
    return [...films]
      .filter(f => {
        const year = parseInt((f as any).year || '0');
        const isRecent = year >= recentThreshold;
        const isMainstream = isMainstreamTitle(f.title);
        return isRecent && isMainstream;
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [films, recentThreshold]);
  
  // Recent popular series (last 2 years, mainstream titles, sorted by popularity)
  const popularSeries = useMemo(() => {
    return [...series]
      .filter(s => {
        const year = parseInt((s as any).year || '0');
        const isRecent = year >= recentThreshold;
        const isMainstream = isMainstreamTitle(s.title);
        return isRecent && isMainstream;
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [series, recentThreshold]);
  
  // Classic films (older than 10 years, high rating)
  const classicFilms = useMemo(() => {
    return [...films]
      .filter(f => {
        const year = parseInt((f as any).year || '0');
        const rating = (f as any).rating || 0;
        return year > 0 && year <= classicThreshold && rating >= 7;
      })
      .sort((a, b) => ((b as any).rating || 0) - ((a as any).rating || 0));
  }, [films, classicThreshold]);
  
  // Classic series (older than 10 years, high rating)
  const classicSeries = useMemo(() => {
    return [...series]
      .filter(s => {
        const year = parseInt((s as any).year || '0');
        const rating = (s as any).rating || 0;
        return year > 0 && year <= classicThreshold && rating >= 7;
      })
      .sort((a, b) => ((b as any).rating || 0) - ((a as any).rating || 0));
  }, [series, classicThreshold]);
  
  // Helper: Check if title contains Korean characters
  const isKoreanTitle = (title: string): boolean => {
    const koreanPattern = /[\uac00-\ud7af]/;
    return koreanPattern.test(title);
  };
  
  // Helper: Check if title contains Japanese characters (Hiragana, Katakana, or common Kanji)
  const isJapaneseTitle = (title: string): boolean => {
    const japanesePattern = /[\u3040-\u30ff\u31f0-\u31ff]/;
    return japanesePattern.test(title);
  };
  
  // Helper: Check if title contains Chinese characters (not Japanese)
  const isChineseTitle = (title: string): boolean => {
    const cjkPattern = /[\u4e00-\u9fff]/;
    const japanesePattern = /[\u3040-\u30ff\u31f0-\u31ff]/;
    return cjkPattern.test(title) && !japanesePattern.test(title);
  };
  
  // Kdramas (Korean content - films AND series) - popular with VF/VOSTFR
  const kdramas = useMemo(() => {
    return [...library]
      .filter(m => {
        const title = m.title || '';
        const genres = m.genres?.toLowerCase() || '';
        const language = m.language?.toLowerCase() || '';
        // Korean title OR Korean-related genres
        const isKorean = isKoreanTitle(title) || 
          (genres.includes('drama') && (genres.includes('korea') || genres.includes('coré'))) ||
          language.includes('coré') || language.includes('korea');
        return isKorean;
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [library]);
  
  // Japanese Animes - popular with VF/VOSTFR
  const japaneseAnimes = useMemo(() => {
    return [...library]
      .filter(m => {
        const title = m.title || '';
        const genres = m.genres?.toLowerCase() || '';
        const type = m.type;
        // Anime type OR Japanese title with anime/animation genre
        const isJapaneseAnime = type === 'Animé' || 
          (isJapaneseTitle(title) && (genres.includes('anim') || genres.includes('anime'))) ||
          genres.includes('anime');
        return isJapaneseAnime;
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [library]);
  
  // Asian Films (Chinese, Korean, Japanese films)
  const asianFilms = useMemo(() => {
    return [...films]
      .filter(f => {
        const title = f.title || '';
        const genres = f.genres?.toLowerCase() || '';
        const language = f.language?.toLowerCase() || '';
        const isAsian = isKoreanTitle(title) || isJapaneseTitle(title) || isChineseTitle(title) ||
          language.includes('coré') || language.includes('japon') || language.includes('chin') ||
          language.includes('asia') || genres.includes('asia');
        return isAsian;
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [films]);
  
  // Bollywood (Indian films)
  const bollywood = useMemo(() => {
    return [...films]
      .filter(f => {
        const title = f.title || '';
        const genres = f.genres?.toLowerCase() || '';
        const language = f.language?.toLowerCase() || '';
        // Hindi characters, Indian-related genres, or Hindi language
        const hindiPattern = /[\u0900-\u097F]/;
        const isIndian = hindiPattern.test(title) ||
          language.includes('hindi') || language.includes('indien') || language.includes('india') ||
          genres.includes('bollywood') || genres.includes('india');
        return isIndian;
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [films]);
  
  // "À venir" - Media without video URLs (coming soon)
  const comingSoon = useMemo(() => {
    return library.filter(m => {
      // For films: no videoUrls
      if (m.type === 'Film' || m.type === 'Animé' || m.type === 'Documentaire') {
        return !m.videoUrls || m.videoUrls.trim() === '';
      }
      // For series/emissions: no episodes with video URLs
      if (m.type === 'Série' || m.type === 'Émission') {
        const hasAnyVideo = m.seasons?.some(s => 
          s.episodes?.some(e => e.videoUrls && e.videoUrls.trim() !== '')
        );
        return !hasAnyVideo;
      }
      return false;
    });
  }, [library]);
  
  const resumeList = useMemo(() => {
    return library
      .filter(m => watchProgress[m.id] && watchProgress[m.id] > 0 && watchProgress[m.id] < 100)
      .map(m => ({ ...m, progress: watchProgress[m.id] }));
  }, [library, watchProgress]);

  const watchlistMedia = useMemo(() => {
    return library.filter(m => watchlist.includes(m.id));
  }, [library, watchlist]);

  const favoritesMedia = useMemo(() => {
    return library.filter(m => favorites.includes(m.id));
  }, [library, favorites]);

  const seenMedia = useMemo(() => {
    return library.filter(m => seen.includes(m.id));
  }, [library, seen]);

  return {
    library,
    films,
    series,
    animes,
    emissions,
    documentaries,
    popularFilms,
    popularSeries,
    classicFilms,
    classicSeries,
    comingSoon,
    kdramas,
    japaneseAnimes,
    asianFilms,
    bollywood,
    heroItems,
    resumeList,
    watchProgress,
    watchPosition,
    watchlist,
    watchlistMedia,
    favorites,
    favoritesMedia,
    seen,
    seenMedia,
    loading,
    addMedia,
    updateMedia,
    deleteMedia,
    saveHeroItems,
    updateProgress,
    updatePosition,
    toggleWatchlist,
    isInWatchlist,
    toggleFavorite,
    isInFavorites,
    toggleSeen,
    isSeen,
    refetch: fetchMedia,
  };
};
