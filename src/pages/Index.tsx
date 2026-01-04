import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Sliders, Plus, ArrowUp, Film, Tv, Sparkles, Globe, Bookmark, Heart, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Header from '@/components/streaming/Header';
import HeroSection from '@/components/streaming/HeroSection';
import ResumeSection from '@/components/streaming/ResumeSection';
import MediaRow from '@/components/streaming/MediaRow';
import ToggleSlideRow from '@/components/streaming/ToggleSlideRow';
import CategoryPage from '@/components/streaming/CategoryPage';
import MediaDetailPage from '@/components/streaming/MediaDetailPage';
import VideoPlayer from '@/components/streaming/VideoPlayer';
import AdminLoginModal from '@/components/streaming/AdminLoginModal';
import MediaEditorModal from '@/components/streaming/MediaEditorModal';
import HeroEditorModal from '@/components/streaming/HeroEditorModal';
import SettingsPage from '@/components/streaming/SettingsPage';
import AdvancedAdLayout from '@/components/streaming/AdvancedAdLayout';
import Footer from '@/components/streaming/Footer';
import CookieConsent from '@/components/streaming/CookieConsent';
import { useSupabaseMedia } from '@/hooks/useSupabaseMedia';
import { useEnhancedResumeList, type EnhancedResumeMedia } from '@/hooks/useResumeProgress';
import { useAdmin } from '@/hooks/useAdmin';
import type { Media, HeroItem } from '@/types/media';

// Helper: Check if media has video uploaded
const hasVideoUploaded = (m: Media): boolean => {
  if (m.type === 'Série' || m.type === 'Émission') {
    return m.seasons?.some(s => s.episodes?.some(e => e.videoUrls && e.videoUrls.trim() !== '')) || false;
  }
  return !!(m.videoUrls && m.videoUrls.trim() !== '');
};

// Génère les hero items automatiquement à partir des médias populaires récents (1 an max)
// Moitié featured (marqués populaire par admin), moitié random
const generateAutoHeroItems = (library: Media[], featuredMedia: Media[] = []): HeroItem[] => {
  if (library.length === 0) return [];
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const heroThreshold = currentYear - 1; // Only content from last 1 year for hero
  
  // Rotation toutes les heures
  const hoursSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60));
  const rotationPeriod = hoursSinceEpoch;
  
  // Helper: Check if title is mainstream (latin characters, no CJK/Korean scripts)
  const isMainstreamTitle = (title: string): boolean => {
    const cjkPattern = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/;
    return !cjkPattern.test(title);
  };
  
  // Get featured media with video and backdrop (for hero display)
  const eligibleFeatured = featuredMedia
    .filter(m => hasVideoUploaded(m) && (m as any).backdrop)
    .sort(() => (Math.random() - 0.5) * rotationPeriod % 10); // Randomize based on hour
  
  // Filtrer les médias récents (1 an), mainstream, avec backdrop, bonne note, ET avec vidéo uploadée
  const eligibleMedia = library
    .filter(m => {
      const year = parseInt((m as any).year || '0');
      const hasBackdrop = !!(m as any).backdrop;
      const hasGoodRating = ((m as any).rating || 0) >= 6;
      const isRecent = year >= heroThreshold;
      const isMainstream = isMainstreamTitle(m.title);
      const hasVideo = hasVideoUploaded(m);
      const isNotFeatured = !(m as any).isFeatured; // Exclude featured to avoid duplicates
      return hasBackdrop && hasGoodRating && isRecent && isMainstream && hasVideo && isNotFeatured;
    })
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  
  // Calculate how many featured vs random (aim for 3 featured, 3 random = 6 total)
  const numFeatured = Math.min(3, eligibleFeatured.length);
  const numRandom = 6 - numFeatured;
  
  const selectedFeatured = eligibleFeatured.slice(0, numFeatured);
  
  // Shuffle random selection based on rotation period
  const shuffledRandom = [...eligibleMedia.slice(0, 20)].sort((a, b) => {
    const hashA = ((a.title.charCodeAt(0) || 0) * rotationPeriod) % 100;
    const hashB = ((b.title.charCodeAt(0) || 0) * rotationPeriod) % 100;
    return hashB - hashA;
  }).slice(0, numRandom);
  
  // Combine and interleave: featured, random, featured, random...
  const combined: Media[] = [];
  for (let i = 0; i < Math.max(selectedFeatured.length, shuffledRandom.length); i++) {
    if (i < selectedFeatured.length) combined.push(selectedFeatured[i]);
    if (i < shuffledRandom.length) combined.push(shuffledRandom[i]);
  }
  
  if (combined.length === 0) {
    // Fallback: prendre les médias les plus populaires avec image et vidéo
    const fallback = library
      .filter(m => m.image && (m as any).backdrop && hasVideoUploaded(m))
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 6);
    return fallback.map(m => ({
      id: `hero-auto-${m.id}-${rotationPeriod}`,
      title: m.title.toUpperCase(),
      description: m.description || m.synopsis || '',
      image: (m as any).backdrop || m.image,
      mediaId: m.id,
    }));
  }
  
  return combined.slice(0, 6).map(m => ({
    id: `hero-auto-${m.id}-${rotationPeriod}`,
    title: m.title.toUpperCase(),
    description: m.description || m.synopsis || '',
    image: (m as any).backdrop || m.image,
    mediaId: m.id,
  }));
};

type ViewType = 'home' | 'films' | 'series' | 'watchlist' | 'favorites' | 'detail' | 'player' | 'settings' | 'category';

interface CategoryView {
  title: string;
  filter: (media: Media) => boolean;
}

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Map pathname to view type
  const getViewFromPath = (pathname: string): ViewType => {
    const pathMap: Record<string, ViewType> = {
      '/': 'home',
      '/films': 'films',
      '/series': 'series',
      '/watchlist': 'watchlist',
      '/favorites': 'favorites',
      '/settings': 'settings',
      '/detail': 'detail',
      '/player': 'player',
    };
    return pathMap[pathname] || 'home';
  };

  const [view, setViewState] = useState<ViewType>(() => getViewFromPath(location.pathname));

  // Navigate to a proper route
  const setView = (
    next: ViewType,
    options?: { replace?: boolean; mediaId?: string; seasonId?: string; episodeId?: string },
  ) => {
    setViewState(next);

    // Category view uses an in-memory filter function -> keep URL unchanged
    if (next === 'category') return;

    // Build the target path
    const pathMap: Record<ViewType, string> = {
      home: '/',
      films: '/films',
      series: '/series',
      watchlist: '/watchlist',
      favorites: '/favorites',
      settings: '/settings',
      detail: '/detail',
      player: '/player',
      category: '/',
    };

    let targetPath = pathMap[next] || '/';

    // Add query params for detail/player views
    const params = new URLSearchParams();
    if (options?.mediaId) params.set('id', options.mediaId);
    if (options?.seasonId) params.set('s', options.seasonId);
    if (options?.episodeId) params.set('e', options.episodeId);

    const queryString = params.toString();
    if (queryString) {
      targetPath += `?${queryString}`;
    }

    navigate(targetPath, { replace: options?.replace ?? false });
  };

  const [categoryView, setCategoryView] = useState<CategoryView | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [playerSeasonId, setPlayerSeasonId] = useState<string | undefined>();
  const [playerEpisodeId, setPlayerEpisodeId] = useState<string | undefined>();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showHeroEditor, setShowHeroEditor] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Partial<Media> | null>(null);

  const {
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
    watchProgress,
    featuredMedia,
    watchPosition,
    watchlistMedia,
    favoritesMedia,
    loading,
    addMedia,
    updateMedia,
    deleteMedia,
    toggleFeatured,
    updateProgress,
    updatePosition,
    saveHeroItems,
    toggleWatchlist,
    isInWatchlist,
    toggleFavorite,
    isInFavorites,
    toggleSeen,
    isSeen,
  } = useSupabaseMedia();

  // Sync UI state to URL (and support browser back/forward + shared links)
  useEffect(() => {
    const nextView = getViewFromPath(location.pathname);

    // Category can't be reconstructed from URL (its filter is a function)
    if (nextView === 'category') {
      setCategoryView(null);
      setViewState('home');
      return;
    }

    if (nextView === 'detail' || nextView === 'player') {
      const id = searchParams.get('id');
      if (!id) {
        setSelectedMedia(null);
        setPlayerSeasonId(undefined);
        setPlayerEpisodeId(undefined);
        navigate('/', { replace: true });
        return;
      }

      const media = library.find(m => m.id === id);
      if (media) {
        setSelectedMedia(media);
        if (nextView === 'player') {
          setPlayerSeasonId(searchParams.get('s') ?? undefined);
          setPlayerEpisodeId(searchParams.get('e') ?? undefined);
        }
        setViewState(nextView);
        return;
      }

      // If the library finished loading and we still can't find it, go home
      if (!loading) {
        setSelectedMedia(null);
        setPlayerSeasonId(undefined);
        setPlayerEpisodeId(undefined);
        navigate('/', { replace: true });
      }
      return;
    }

    setViewState(nextView);
  }, [location.pathname, searchParams, library, loading, navigate]);

  // Enhanced resume list with new episode detection
  const resumeList = useEnhancedResumeList(library, watchProgress, watchPosition);

  const { isAdmin, login, logout } = useAdmin();

  // Fallback: open settings even if the footer prop isn't wired (HMR / stale props)
  useEffect(() => {
    const listener = () => setView('settings');
    window.addEventListener('gctv-open-settings', listener);
    return () => window.removeEventListener('gctv-open-settings', listener);
  }, []);

  // Get unique genres from library
  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();
    library.forEach(m => {
      if (m.genres) {
        m.genres.split(',').forEach(g => genreSet.add(g.trim()));
      }
    });
    return Array.from(genreSet).sort();
  }, [library]);

  // Filter media by genre
  const getMediaByGenre = (genre: string) => {
    return library.filter(m => m.genres?.toLowerCase().includes(genre.toLowerCase()));
  };

  // Filter films by genre
  const getFilmsByGenre = (genre: string) => {
    return films.filter(m => m.genres?.toLowerCase().includes(genre.toLowerCase()));
  };

  // Filter series by genre
  const getSeriesByGenre = (genre: string) => {
    return series.filter(m => m.genres?.toLowerCase().includes(genre.toLowerCase()));
  };

  // Open category page
  const openCategoryPage = (title: string, filter: (media: Media) => boolean) => {
    setCategoryView({ title, filter });
    setView('category');
  };

  // Go to detail page when clicking a media card
  const handleSelectMedia = (media: Media) => {
    setSelectedMedia(media);
    setView('detail', { mediaId: media.id });
  };

  const getResumeParams = (media: Media) => {
    if (media.type !== 'Série') return { seasonId: undefined, episodeId: undefined };
    const pos = watchPosition[media.id];
    return { seasonId: pos?.seasonId, episodeId: pos?.episodeId };
  };

  // Play from hero - go directly to player (resume for series)
  const handlePlayHero = (mediaId: string) => {
    const media = library.find(m => m.id === mediaId);
    if (media) {
      const { seasonId, episodeId } = getResumeParams(media);
      setSelectedMedia(media);
      setPlayerSeasonId(seasonId);
      setPlayerEpisodeId(episodeId);
      setView('player', { mediaId: media.id, seasonId, episodeId });
    }
  };

  // Info from hero - open detail page
  const handleInfoHero = (mediaId: string) => {
    const media = library.find(m => m.id === mediaId);
    if (media) {
      setSelectedMedia(media);
      setView('detail', { mediaId: media.id });
    }
  };

  // Play from detail page
  const handlePlayFromDetail = (media: Media, seasonId?: string, episodeId?: string) => {
    setSelectedMedia(media);
    setPlayerSeasonId(seasonId);
    setPlayerEpisodeId(episodeId);
    setView('player', { mediaId: media.id, seasonId, episodeId });
  };

  // Resume playing (use next episode/season if new content available, else saved position)
  const handleResumeSelect = (media: EnhancedResumeMedia, overrideSeasonId?: string, overrideEpisodeId?: string) => {
    // Use the override (new content) if provided, otherwise fall back to saved position
    const seasonId = overrideSeasonId || watchPosition[media.id]?.seasonId;
    const episodeId = overrideEpisodeId || watchPosition[media.id]?.episodeId;
    setSelectedMedia(media);
    setPlayerSeasonId(seasonId);
    setPlayerEpisodeId(episodeId);
    setView('player', { mediaId: media.id, seasonId, episodeId });
  };

  const handleBack = () => {
    if (view === 'player') {
      // Best-effort progress for films (no real playback tracking with iframe)
      if (selectedMedia?.type === 'Film') {
        updateProgress(selectedMedia.id, 100);
      }
      setView('detail', { replace: true, mediaId: selectedMedia?.id });
      setPlayerSeasonId(undefined);
      setPlayerEpisodeId(undefined);
    } else if (view === 'category') {
      setCategoryView(null);
      setView('home', { replace: true });
    } else {
      setSelectedMedia(null);
      setView('home', { replace: true });
    }
  };

  const handleAddMedia = () => {
    setEditingMedia({ title: '', image: '', type: 'Film', description: '', seasons: [] });
    setShowEditor(true);
  };

  const handleEditMedia = (media: Media) => {
    setEditingMedia(media);
    setShowEditor(true);
  };

  const handleSaveMedia = (media: Media) => {
    if (editingMedia?.id) {
      updateMedia(media.id, media);
    } else {
      addMedia(media);
    }
    setShowEditor(false);
    setEditingMedia(null);
  };

  const handleSaveHeroItems = (items: HeroItem[]) => {
    saveHeroItems(items);
  };

  const handleProgress = (mediaId: string, progress: number) => {
    updateProgress(mediaId, progress);
  };

  const handlePosition = (mediaId: string, seasonId: string, episodeId: string) => {
    updatePosition(mediaId, seasonId, episodeId);
  };

  // Force hero refresh every hour with state-based refresh trigger
  const [heroRefreshKey, setHeroRefreshKey] = useState(() => Math.floor(Date.now() / (1000 * 60 * 60)));
  
  useEffect(() => {
    // Check every minute if we need to refresh hero items
    const checkInterval = setInterval(() => {
      const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
      if (currentHour !== heroRefreshKey) {
        setHeroRefreshKey(currentHour);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkInterval);
  }, [heroRefreshKey]);
  
  // Générer les hero items automatiquement avec featured media (recalcule quand heroRefreshKey change)
  const autoHeroItems = useMemo(() => generateAutoHeroItems(library, featuredMedia), [library, featuredMedia, heroRefreshKey]);
  const displayHeroItems = heroItems.length > 0 ? heroItems : autoHeroItems;
  
  // Inverser TOUS les contenus populaires (les plus en bas deviennent premiers)
  const invertedPopularFilms = useMemo(() => {
    return [...popularFilms].reverse();
  }, [popularFilms]);
  
  const invertedPopularSeries = useMemo(() => {
    return [...popularSeries].reverse();
  }, [popularSeries]);
  
  // Sélectionner les 4 genres principaux pour films et séries (pas de répétition)
  const topFilmGenres = useMemo(() => {
    return allGenres
      .filter(g => getFilmsByGenre(g).length >= 3)
      .slice(0, 4);
  }, [allGenres, films]);
  
  const topSeriesGenres = useMemo(() => {
    return allGenres
      .filter(g => getSeriesByGenre(g).length >= 3 && !topFilmGenres.includes(g))
      .slice(0, 3);
  }, [allGenres, series, topFilmGenres]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        view={view === 'category' ? 'home' : view}
        setView={(v) => { setCategoryView(null); setView(v as ViewType); }}
        isAdmin={isAdmin}
        onAdminClick={() => setShowAdminLogin(true)}
        onLogout={logout}
        library={library}
        onSelectMedia={handleSelectMedia}
      />

      <main className="min-h-[calc(100vh-140px)]">
        <AdvancedAdLayout showAds={view !== 'settings'}>
          {view === 'settings' ? (
            <SettingsPage 
              onBack={() => setView('home')} 
              library={library}
              onEditMedia={handleEditMedia}
              onAddMedia={addMedia}
              onAddNewMedia={handleAddMedia}
              onDeleteMedia={deleteMedia}
              onToggleFeatured={toggleFeatured}
            />
        ) : view === 'player' && selectedMedia ? (
          <VideoPlayer 
            media={selectedMedia}
            initialSeasonId={playerSeasonId}
            initialEpisodeId={playerEpisodeId}
            onBack={handleBack}
            onProgress={handleProgress}
            onPosition={handlePosition}
          />
        ) : view === 'detail' && selectedMedia ? (
          <MediaDetailPage
            media={selectedMedia}
            onBack={handleBack}
            onPlay={handlePlayFromDetail}
            isInWatchlist={isInWatchlist(selectedMedia.id)}
            onToggleWatchlist={toggleWatchlist}
            isInFavorites={isInFavorites(selectedMedia.id)}
            onToggleFavorite={toggleFavorite}
            isSeen={isSeen(selectedMedia.id)}
            onToggleSeen={toggleSeen}
            watchPosition={watchPosition[selectedMedia.id]}
          />
        ) : view === 'category' && categoryView ? (
          <CategoryPage
            title={categoryView.title}
            media={library.filter(categoryView.filter)}
            onBack={handleBack}
            onSelect={handleSelectMedia}
            isAdmin={isAdmin}
            onEdit={handleEditMedia}
            onDelete={deleteMedia}
          />
        ) : (
          <div className="py-4">
            {view === 'home' && (
              <>
                {/* Admin Controls */}
                {isAdmin && (
                  <div className="flex justify-end gap-3 mb-4 px-4 md:px-8 max-w-[1600px] mx-auto flex-wrap">
                    <Button
                      onClick={() => setShowHeroEditor(true)}
                      variant="outline"
                      className="rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-2"
                    >
                      <Sliders size={16} />
                      Gérer les slides
                    </Button>
                  </div>
                )}
                
                <div className="px-4 md:px-8 max-w-[1600px] mx-auto">
                  <HeroSection 
                    heroItems={displayHeroItems} 
                    onPlay={handlePlayHero}
                    onInfo={handleInfoHero}
                  />
                </div>
                
                {/* Resume Section */}
                <div className="px-4 md:px-8 max-w-[1600px] mx-auto">
                  <ResumeSection 
                    resumeList={resumeList}
                    onSelect={handleResumeSelect}
                  />
                </div>

                {/* Content Rows */}
                <div className="px-4 md:px-8 max-w-[1600px] mx-auto space-y-2">
                  {/* À venir - Contenus sans vidéo */}
                  {comingSoon.length > 0 && (
                    <MediaRow
                      title="À venir"
                      titleIcon={<Clock size={20} className="text-accent" />}
                      media={comingSoon.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('À venir', m => {
                        if (m.type === 'Film') return !m.videoUrls || m.videoUrls.trim() === '';
                        if (m.type === 'Série') {
                          const hasAnyVideo = m.seasons?.some(s => s.episodes?.some(e => e.videoUrls && e.videoUrls.trim() !== ''));
                          return !hasAnyVideo;
                        }
                        return false;
                      })}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}

                  {/* 1. Films populaires - Toggle Slide Row */}
                  {invertedPopularFilms.length > 0 && (
                    <ToggleSlideRow
                      title="Films populaires"
                      titleIcon={<Film size={20} className="text-primary" />}
                      media={invertedPopularFilms.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onPlay={(media) => handlePlayFromDetail(media)}
                      onAddToWatchlist={toggleWatchlist}
                      isInWatchlist={isInWatchlist}
                      onSeeMore={() => openCategoryPage('Films populaires', m => m.type === 'Film')}
                    />
                  )}

                  {/* 2. Séries populaires */}
                  {invertedPopularSeries.length > 0 && (
                    <MediaRow
                      title="Séries populaires"
                      titleIcon={<Tv size={20} className="text-primary" />}
                      media={invertedPopularSeries.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Séries populaires', m => m.type === 'Série')}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* 3. Animés */}
                  {animes.length > 0 && (
                    <MediaRow
                      title="Animés"
                      titleIcon={<Sparkles size={20} className="text-accent" />}
                      media={animes.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Animés', m => m.type === 'Animé')}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* 4. Films en 4K */}
                  {films.filter(f => f.quality === '4K').length > 0 && (
                    <MediaRow
                      title="Films en 4K"
                      titleIcon={<Sparkles size={20} className="text-primary" />}
                      media={films.filter(f => f.quality === '4K').slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Films en 4K', m => m.type === 'Film' && m.quality === '4K')}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* 5. Films cultes */}
                  {classicFilms.length > 0 && (
                    <MediaRow
                      title="Films cultes"
                      titleIcon={<Sparkles size={20} className="text-accent" />}
                      media={classicFilms.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Films cultes', m => {
                        const year = parseInt((m as any).year || '0');
                        return m.type === 'Film' && year > 0 && year <= new Date().getFullYear() - 10;
                      })}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* 6. Séries cultes */}
                  {classicSeries.length > 0 && (
                    <MediaRow
                      title="Séries cultes"
                      titleIcon={<Tv size={20} className="text-secondary" />}
                      media={classicSeries.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Séries cultes', m => {
                        const year = parseInt((m as any).year || '0');
                        return m.type === 'Série' && year > 0 && year <= new Date().getFullYear() - 10;
                      })}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* 7. Documentaires */}
                  {documentaries.length > 0 && (
                    <MediaRow
                      title="Documentaires"
                      titleIcon={<Globe size={20} className="text-secondary" />}
                      media={documentaries.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Documentaires', m => m.type === 'Documentaire')}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* 8. Émissions */}
                  {emissions.length > 0 && (
                    <MediaRow
                      title="Émissions TV"
                      titleIcon={<Tv size={20} className="text-accent" />}
                      media={emissions.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Émissions TV', m => m.type === 'Émission')}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* NICHE CATEGORIES */}
                  
                  {/* Kdramas */}
                  {kdramas.length > 0 && (
                    <MediaRow
                      title="Kdramas"
                      titleIcon={<Sparkles size={20} className="text-pink-500" />}
                      media={kdramas.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Kdramas', m => {
                        const title = m.title || '';
                        const genres = m.genres?.toLowerCase() || '';
                        const language = m.language?.toLowerCase() || '';
                        const koreanPattern = /[\uac00-\ud7af]/;
                        return koreanPattern.test(title) || 
                          (genres.includes('drama') && (genres.includes('korea') || genres.includes('coré'))) ||
                          language.includes('coré') || language.includes('korea');
                      })}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* Animes */}
                  {japaneseAnimes.length > 0 && (
                    <MediaRow
                      title="Animes"
                      titleIcon={<Sparkles size={20} className="text-red-500" />}
                      media={japaneseAnimes.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Animes', m => m.type === 'Animé')}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* Films Asiatiques */}
                  {asianFilms.length > 0 && (
                    <MediaRow
                      title="Films Asiatiques"
                      titleIcon={<Globe size={20} className="text-yellow-500" />}
                      media={asianFilms.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Films Asiatiques', m => {
                        const title = m.title || '';
                        const koreanPattern = /[\uac00-\ud7af]/;
                        const japanesePattern = /[\u3040-\u30ff\u31f0-\u31ff]/;
                        const chinesePattern = /[\u4e00-\u9fff]/;
                        return m.type === 'Film' && (koreanPattern.test(title) || japanesePattern.test(title) || chinesePattern.test(title));
                      })}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* Bollywood */}
                  {bollywood.length > 0 && (
                    <MediaRow
                      title="Bollywood"
                      titleIcon={<Film size={20} className="text-orange-500" />}
                      media={bollywood.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Bollywood', m => {
                        const genres = m.genres?.toLowerCase() || '';
                        const language = m.language?.toLowerCase() || '';
                        return m.type === 'Film' && (genres.includes('bollywood') || genres.includes('india') || language.includes('hindi'));
                      })}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* Disponible en VF */}
                  {library.filter(m => m.language === 'VF').length > 0 && (
                    <MediaRow
                      title="Disponible en VF"
                      titleIcon={<Globe size={20} className="text-primary" />}
                      media={library.filter(m => m.language === 'VF').slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Disponible en VF', m => m.language === 'VF')}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}

                  {/* 5-8. Top 4 genres Films */}
                  {topFilmGenres.map((genre) => {
                    const genreFilms = getFilmsByGenre(genre);
                    return (
                      <MediaRow
                        key={`film-${genre}`}
                        title={`${genre} – Films`}
                        media={genreFilms.slice(0, 20)}
                        onSelect={handleSelectMedia}
                        onSeeMore={() => openCategoryPage(`${genre} – Films`, m => 
                          m.type === 'Film' && (m.genres?.toLowerCase().includes(genre.toLowerCase()) || false)
                        )}
                        isAdmin={isAdmin}
                        onEdit={handleEditMedia}
                        onDelete={deleteMedia}
                      />
                    );
                  })}

                  {/* 9-11. Top 3 genres Séries */}
                  {topSeriesGenres.map((genre) => {
                    const genreSeries = getSeriesByGenre(genre);
                    return (
                      <MediaRow
                        key={`serie-${genre}`}
                        title={`${genre} – Séries`}
                        media={genreSeries.slice(0, 20)}
                        onSelect={handleSelectMedia}
                        onSeeMore={() => openCategoryPage(`${genre} – Séries`, m => 
                          m.type === 'Série' && (m.genres?.toLowerCase().includes(genre.toLowerCase()) || false)
                        )}
                        isAdmin={isAdmin}
                        onEdit={handleEditMedia}
                        onDelete={deleteMedia}
                      />
                    );
                  })}

                  {/* 12. Ma liste */}
                  {watchlistMedia.length > 0 && (
                    <MediaRow
                      title="Ma liste"
                      titleIcon={<Bookmark size={20} className="text-primary" />}
                      media={watchlistMedia.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Ma liste', m => isInWatchlist(m.id))}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                      showRemoveButton={true}
                      onRemove={toggleWatchlist}
                    />
                  )}

                  {/* 13. Favoris */}
                  {favoritesMedia.length > 0 && (
                    <MediaRow
                      title="Favoris"
                      titleIcon={<Heart size={20} className="text-primary" />}
                      media={favoritesMedia.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Favoris', m => isInFavorites(m.id))}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                      showRemoveButton={true}
                      onRemove={toggleFavorite}
                    />
                  )}
                </div>
              </>
            )}

            {/* Films/Series/Watchlist specific views */}
            {view === 'films' && (
              <div className="px-4 md:px-8 max-w-[1600px] mx-auto space-y-2">
                <MediaRow
                  title="Tous les films"
                  media={films.slice(0, 10)}
                  onSelect={handleSelectMedia}
                  onSeeMore={() => openCategoryPage('Tous les films', m => m.type === 'Film')}
                  isAdmin={isAdmin}
                  onEdit={handleEditMedia}
                  onDelete={deleteMedia}
                />
                {allGenres.filter(g => getFilmsByGenre(g).length >= 2).map(genre => {
                  const genreFilms = getFilmsByGenre(genre);
                  return (
                    <MediaRow
                      key={genre}
                      title={`${genre} – Films`}
                      media={genreFilms.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage(`${genre} – Films`, m => 
                        m.type === 'Film' && (m.genres?.toLowerCase().includes(genre.toLowerCase()) || false)
                      )}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  );
                })}
              </div>
            )}

            {view === 'series' && (
              <div className="px-4 md:px-8 max-w-[1600px] mx-auto space-y-2">
                <MediaRow
                  title="Toutes les séries"
                  media={series.slice(0, 10)}
                  onSelect={handleSelectMedia}
                  onSeeMore={() => openCategoryPage('Toutes les séries', m => m.type === 'Série')}
                  isAdmin={isAdmin}
                  onEdit={handleEditMedia}
                  onDelete={deleteMedia}
                />
                {allGenres.filter(g => getSeriesByGenre(g).length >= 2).map(genre => {
                  const genreSeries = getSeriesByGenre(genre);
                  return (
                    <MediaRow
                      key={genre}
                      title={`${genre} – Séries`}
                      media={genreSeries.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage(`${genre} – Séries`, m => 
                        m.type === 'Série' && (m.genres?.toLowerCase().includes(genre.toLowerCase()) || false)
                      )}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  );
                })}
              </div>
            )}

            {view === 'watchlist' && (
              <div className="px-4 md:px-8 max-w-[1600px] mx-auto">
                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-2">
                  <Bookmark size={24} className="text-primary" />
                  Ma Watchlist
                </h2>
                {watchlistMedia.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {watchlistMedia.map(item => (
                      <div key={item.id}>
                        <div 
                          className="group relative rounded-2xl overflow-hidden cursor-pointer bg-card border border-border/30 hover:border-primary/30 transition-all duration-300"
                          onClick={() => handleSelectMedia(item)}
                        >
                          <div className="aspect-[2/3] overflow-hidden">
                            <img 
                              src={item.image} 
                              alt={item.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card/50 rounded-3xl border border-border/50">
                    <Bookmark size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Votre watchlist est vide.</p>
                  </div>
                )}
              </div>
            )}

            {view === 'favorites' && (
              <div className="px-4 md:px-8 max-w-[1600px] mx-auto">
                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-2">
                  <Heart size={24} className="text-red-500" />
                  Mes Favoris
                </h2>
                {favoritesMedia.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {favoritesMedia.map(item => (
                      <div key={item.id}>
                        <div 
                          className="group relative rounded-2xl overflow-hidden cursor-pointer bg-card border border-border/30 hover:border-red-500/30 transition-all duration-300"
                          onClick={() => handleSelectMedia(item)}
                        >
                          <div className="aspect-[2/3] overflow-hidden">
                            <img 
                              src={item.image} 
                              alt={item.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                          </div>
                          <div className="absolute top-2 right-2">
                            <Heart size={20} className="text-red-500 fill-red-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card/50 rounded-3xl border border-border/50">
                    <Heart size={48} className="mx-auto text-red-500/50 mb-4" />
                    <p className="text-muted-foreground">Vous n'avez pas encore de favoris.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </AdvancedAdLayout>
      </main>

      {/* Footer */}
      <Footer isAdmin={isAdmin} onSettingsClick={() => setView('settings')} />

      {/* Scroll to top */}
      <Button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-glow z-40"
        size="icon"
      >
        <ArrowUp size={20} />
      </Button>

      {/* Modals */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLogin={login}
      />

      <MediaEditorModal
        isOpen={showEditor}
        media={editingMedia}
        onClose={() => { setShowEditor(false); setEditingMedia(null); }}
        onSave={handleSaveMedia}
      />

      <HeroEditorModal
        isOpen={showHeroEditor}
        heroItems={displayHeroItems}
        mediaOptions={library}
        onClose={() => setShowHeroEditor(false)}
        onSave={handleSaveHeroItems}
      />

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
};

export default Index;
