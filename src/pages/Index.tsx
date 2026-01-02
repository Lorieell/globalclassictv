import { useEffect, useState, useMemo } from 'react';
import { Sliders, Plus, ArrowUp, Film, Tv, Sparkles, Globe, Bookmark, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Header from '@/components/streaming/Header';
import HeroSection from '@/components/streaming/HeroSection';
import ResumeSection from '@/components/streaming/ResumeSection';
import MediaRow from '@/components/streaming/MediaRow';
import CategoryPage from '@/components/streaming/CategoryPage';
import MediaDetailPage from '@/components/streaming/MediaDetailPage';
import VideoPlayer from '@/components/streaming/VideoPlayer';
import AdminLoginModal from '@/components/streaming/AdminLoginModal';
import MediaEditorModal from '@/components/streaming/MediaEditorModal';
import HeroEditorModal from '@/components/streaming/HeroEditorModal';
import SettingsPage from '@/components/streaming/SettingsPage';
import AdLayout from '@/components/streaming/AdLayout';
import Footer from '@/components/streaming/Footer';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { useAdmin } from '@/hooks/useAdmin';
import type { Media, HeroItem } from '@/types/media';

// Génère les hero items automatiquement à partir des médias populaires (change toutes les heures)
const generateAutoHeroItems = (library: Media[]): HeroItem[] => {
  if (library.length === 0) return [];
  
  const now = new Date();
  // Rotation toutes les heures
  const hoursSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60));
  const rotationPeriod = hoursSinceEpoch;
  
  // Filtrer les médias avec backdrop et bonne note
  const eligibleMedia = library.filter(m => 
    (m as any).backdrop && (m as any).rating >= 6
  );
  
  if (eligibleMedia.length === 0) {
    // Fallback: prendre les premiers médias avec image
    const fallback = library.filter(m => m.image).slice(0, 6);
    return fallback.map(m => ({
      id: `hero-auto-${m.id}-${rotationPeriod}`,
      title: m.title.toUpperCase(),
      description: m.description || m.synopsis || '',
      image: (m as any).backdrop || m.image,
      mediaId: m.id,
    }));
  }
  
  // Mélanger de façon déterministe basée sur l'heure de rotation
  const shuffled = [...eligibleMedia].sort((a, b) => {
    const hashA = ((a.title.charCodeAt(0) || 0) * rotationPeriod + (a.title.length || 0) + ((a as any).rating || 0) * 100) % 10000;
    const hashB = ((b.title.charCodeAt(0) || 0) * rotationPeriod + (b.title.length || 0) + ((b as any).rating || 0) * 100) % 10000;
    return hashA - hashB;
  });
  
  // Prendre 6 items
  return shuffled.slice(0, 6).map(m => ({
    id: `hero-auto-${m.id}-${rotationPeriod}`,
    title: m.title.toUpperCase(),
    description: m.description || m.synopsis || '',
    image: (m as any).backdrop || m.image,
    mediaId: m.id,
  }));
};

type ViewType = 'home' | 'films' | 'series' | 'watchlist' | 'detail' | 'player' | 'settings' | 'category';

interface CategoryView {
  title: string;
  filter: (media: Media) => boolean;
}

const Index = () => {
  const [view, setView] = useState<ViewType>('home');
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
    heroItems, 
    resumeList,
    watchPosition,
    watchlistMedia,
    favoritesMedia,
    loading,
    addMedia,
    updateMedia,
    deleteMedia,
    updateProgress,
    updatePosition,
    saveHeroItems,
    toggleWatchlist,
    isInWatchlist,
    toggleFavorite,
    isInFavorites,
    toggleSeen,
    isSeen,
  } = useMediaLibrary();

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
    setView('detail');
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
      setView('player');
    }
  };

  // Info from hero - open detail page
  const handleInfoHero = (mediaId: string) => {
    const media = library.find(m => m.id === mediaId);
    if (media) {
      setSelectedMedia(media);
      setView('detail');
    }
  };

  // Play from detail page
  const handlePlayFromDetail = (media: Media, seasonId?: string, episodeId?: string) => {
    setSelectedMedia(media);
    setPlayerSeasonId(seasonId);
    setPlayerEpisodeId(episodeId);
    setView('player');
  };

  // Resume playing (use saved season/episode for series)
  const handleResumeSelect = (media: Media) => {
    const { seasonId, episodeId } = getResumeParams(media);
    setSelectedMedia(media);
    setPlayerSeasonId(seasonId);
    setPlayerEpisodeId(episodeId);
    setView('player');
  };

  const handleBack = () => {
    if (view === 'player') {
      // Best-effort progress for films (no real playback tracking with iframe)
      if (selectedMedia?.type === 'Film') {
        updateProgress(selectedMedia.id, 100);
      }
      setView('detail');
      setPlayerSeasonId(undefined);
      setPlayerEpisodeId(undefined);
    } else if (view === 'category') {
      setCategoryView(null);
      setView('home');
    } else {
      setSelectedMedia(null);
      setView('home');
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

  // Générer les hero items automatiquement
  const autoHeroItems = useMemo(() => generateAutoHeroItems(library), [library]);
  const displayHeroItems = heroItems.length > 0 ? heroItems : autoHeroItems;
  
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
        <AdLayout showAds={view !== 'settings'}>
          {view === 'settings' ? (
            <SettingsPage 
              onBack={() => setView('home')} 
              library={library}
              onEditMedia={handleEditMedia}
              onAddMedia={addMedia}
              onAddNewMedia={handleAddMedia}
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

                {/* Content Rows - Max 13 lignes */}
                <div className="px-4 md:px-8 max-w-[1600px] mx-auto space-y-2">
                  {/* 1. Films populaires */}
                  {films.length > 0 && (
                    <MediaRow
                      title="Films populaires"
                      titleIcon={<Film size={20} className="text-primary" />}
                      media={films.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Films populaires', m => m.type === 'Film')}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}

                  {/* 2. Séries populaires */}
                  {series.length > 0 && (
                    <MediaRow
                      title="Séries populaires"
                      titleIcon={<Tv size={20} className="text-primary" />}
                      media={series.slice(0, 20)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Séries populaires', m => m.type === 'Série')}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}
                  
                  {/* 3. Films en 4K */}
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
                  
                  {/* 4. Disponible en VF */}
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
                {watchlistMedia.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8">
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
                  <div className="text-center py-20 bg-card/50 rounded-3xl border border-border/50 mt-8">
                    <p className="text-muted-foreground">Votre liste est vide.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </AdLayout>
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
        heroItems={heroItems}
        mediaOptions={library}
        onClose={() => setShowHeroEditor(false)}
        onSave={handleSaveHeroItems}
      />
    </div>
  );
};

export default Index;
