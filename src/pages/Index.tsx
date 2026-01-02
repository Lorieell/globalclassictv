import { useEffect, useState, useMemo } from 'react';
import { Sliders, Plus, ArrowUp, Download, Loader2, Trash2 } from 'lucide-react';
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

// Fonction pour obtenir les genres rotatifs basés sur la date
const getRotatingGenres = (allGenres: string[], type: 'films' | 'series') => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const weekOfYear = Math.floor(dayOfYear / 7);
  
  // Utiliser différents seeds pour films et séries
  const seed = type === 'films' ? weekOfYear : weekOfYear + 100;
  
  // Mélanger les genres de façon déterministe basée sur le seed
  const shuffled = [...allGenres].sort((a, b) => {
    const hashA = (a.charCodeAt(0) * seed) % 100;
    const hashB = (b.charCodeAt(0) * seed) % 100;
    return hashA - hashB;
  });
  
  // Retourner un sous-ensemble qui change chaque semaine
  return shuffled.slice(0, Math.min(6, shuffled.length));
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
  const [isImporting, setIsImporting] = useState(false);

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

  // Reset library and reimport from TMDB
  const handleResetAndImport = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider la bibliothèque et réimporter tout depuis TMDB ?')) {
      return;
    }
    
    setIsImporting(true);
    try {
      // Clear localStorage
      localStorage.removeItem('gctv-library');
      localStorage.removeItem('gctv-hero');
      
      toast.info('Bibliothèque vidée, import en cours...');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all', pages: 3 }),
        }
      );
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Save directly to localStorage and reload
        localStorage.setItem('gctv-library', JSON.stringify(result.data));
        toast.success(`${result.data.length} contenus importés depuis TMDB`);
        // Reload to refresh the state
        window.location.reload();
      } else {
        toast.error(result.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('TMDB import error:', error);
      toast.error('Erreur de connexion au service d\'import');
    } finally {
      setIsImporting(false);
    }
  };

  // Import TMDB content (add to existing)
  const handleImportTMDB = async () => {
    setIsImporting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all', pages: 2 }),
        }
      );
      
      const result = await response.json();
      
      if (result.success && result.data) {
        let addedCount = 0;
        for (const media of result.data) {
          // Check if media already exists
          const exists = library.some(m => m.id === media.id || m.title === media.title);
          if (!exists) {
            addMedia(media);
            addedCount++;
          }
        }
        toast.success(`${addedCount} nouveaux contenus importés depuis TMDB`);
      } else {
        toast.error(result.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('TMDB import error:', error);
      toast.error('Erreur de connexion au service d\'import');
    } finally {
      setIsImporting(false);
    }
  };

  // Define sections for Prime Video style layout avec rotation automatique
  const genresWithFilms = allGenres.filter(g => getFilmsByGenre(g).length > 0);
  const genresWithSeries = allGenres.filter(g => getSeriesByGenre(g).length > 0);
  
  // Genres rotatifs qui changent chaque semaine
  const rotatingFilmGenres = useMemo(() => getRotatingGenres(genresWithFilms, 'films'), [genresWithFilms]);
  const rotatingSeriesGenres = useMemo(() => getRotatingGenres(genresWithSeries, 'series'), [genresWithSeries]);

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
            <SettingsPage onBack={() => setView('home')} />
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
                      onClick={handleResetAndImport}
                      disabled={isImporting}
                      variant="outline"
                      className="rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 gap-2"
                    >
                      {isImporting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Réinitialiser + Import
                    </Button>
                    <Button
                      onClick={handleImportTMDB}
                      disabled={isImporting}
                      variant="outline"
                      className="rounded-xl border-green-500/30 text-green-500 hover:bg-green-500/10 gap-2"
                    >
                      {isImporting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      {isImporting ? 'Import en cours...' : 'Ajouter TMDB'}
                    </Button>
                    <Button
                      onClick={() => setShowHeroEditor(true)}
                      variant="outline"
                      className="rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-2"
                    >
                      <Sliders size={16} />
                      Gérer les slides
                    </Button>
                    <Button
                      onClick={handleAddMedia}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
                    >
                      <Plus size={16} />
                      Ajouter un contenu
                    </Button>
                  </div>
                )}
                
                <div className="px-4 md:px-8 max-w-[1600px] mx-auto">
                  <HeroSection 
                    heroItems={heroItems} 
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

                {/* Prime Video Style Rows */}
                <div className="px-4 md:px-8 max-w-[1600px] mx-auto space-y-2">
                  {/* Films populaires */}
                  {films.length > 0 && (
                    <MediaRow
                      title="Films populaires"
                      media={films.slice(0, 10)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Films populaires', m => m.type === 'Film')}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}

                  {/* Séries populaires */}
                  {series.length > 0 && (
                    <MediaRow
                      title="Séries populaires"
                      media={series.slice(0, 10)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Séries populaires', m => m.type === 'Série')}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}

                  {/* Dynamic rotating genre rows for films - changes weekly */}
                  {rotatingFilmGenres.map(genre => {
                    const genreFilms = getFilmsByGenre(genre);
                    if (genreFilms.length < 1) return null;
                    return (
                      <MediaRow
                        key={`film-${genre}`}
                        title={`${genre} – Films`}
                        media={genreFilms.slice(0, 10)}
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

                  {/* Dynamic rotating genre rows for series - changes weekly */}
                  {rotatingSeriesGenres.map(genre => {
                    const genreSeries = getSeriesByGenre(genre);
                    if (genreSeries.length < 1) return null;
                    return (
                      <MediaRow
                        key={`serie-${genre}`}
                        title={`${genre} – Séries`}
                        media={genreSeries.slice(0, 10)}
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

                  {/* Watchlist if has items */}
                  {watchlistMedia.length > 0 && (
                    <MediaRow
                      title="Ma liste"
                      media={watchlistMedia.slice(0, 10)}
                      onSelect={handleSelectMedia}
                      onSeeMore={() => openCategoryPage('Ma liste', m => isInWatchlist(m.id))}
                      isAdmin={isAdmin}
                      onEdit={handleEditMedia}
                      onDelete={deleteMedia}
                    />
                  )}

                  {/* Favoris with heart icon */}
                  {favoritesMedia.length > 0 && (
                    <MediaRow
                      title="❤️ Favoris"
                      media={favoritesMedia.slice(0, 10)}
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
                {genresWithFilms.map(genre => {
                  const genreFilms = getFilmsByGenre(genre);
                  if (genreFilms.length < 2) return null;
                  return (
                    <MediaRow
                      key={genre}
                      title={`${genre} – Films`}
                      media={genreFilms.slice(0, 10)}
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
                {genresWithSeries.map(genre => {
                  const genreSeries = getSeriesByGenre(genre);
                  if (genreSeries.length < 2) return null;
                  return (
                    <MediaRow
                      key={genre}
                      title={`${genre} – Séries`}
                      media={genreSeries.slice(0, 10)}
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
        mediaOptions={library.map(m => ({ id: m.id, title: m.title }))}
        onClose={() => setShowHeroEditor(false)}
        onSave={handleSaveHeroItems}
      />
    </div>
  );
};

export default Index;
