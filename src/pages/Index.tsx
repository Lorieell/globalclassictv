import { useEffect, useState } from 'react';
import { ArrowUp, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/streaming/Header';
import HeroSection from '@/components/streaming/HeroSection';
import ResumeSection from '@/components/streaming/ResumeSection';
import MediaGrid from '@/components/streaming/MediaGrid';
import MediaDetailPage from '@/components/streaming/MediaDetailPage';
import VideoPlayer from '@/components/streaming/VideoPlayer';
import AdminLoginModal from '@/components/streaming/AdminLoginModal';
import MediaEditorModal from '@/components/streaming/MediaEditorModal';
import HeroEditorModal from '@/components/streaming/HeroEditorModal';
import SettingsPage from '@/components/streaming/SettingsPage';
import GlobalAds from '@/components/streaming/GlobalAds';
import Footer from '@/components/streaming/Footer';
import { type LayoutType } from '@/components/streaming/LayoutToggle';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { useAdmin } from '@/hooks/useAdmin';
import type { Media, HeroItem } from '@/types/media';

type ViewType = 'home' | 'films' | 'series' | 'watchlist' | 'detail' | 'player' | 'settings';

const LAYOUT_STORAGE_KEY = 'gctv-layout';

const Index = () => {
  const [view, setView] = useState<ViewType>('home');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [playerSeasonId, setPlayerSeasonId] = useState<string | undefined>();
  const [playerEpisodeId, setPlayerEpisodeId] = useState<string | undefined>();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showHeroEditor, setShowHeroEditor] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Partial<Media> | null>(null);
  const [layout, setLayout] = useState<LayoutType>(() => {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return (stored as LayoutType) || 'grid';
  });

  const handleLayoutChange = (newLayout: LayoutType) => {
    setLayout(newLayout);
    localStorage.setItem(LAYOUT_STORAGE_KEY, newLayout);
  };

  const { 
    library, 
    films, 
    series, 
    heroItems, 
    resumeList,
    watchPosition,
    watchlistMedia,
    loading,
    addMedia,
    updateMedia,
    deleteMedia,
    updateProgress,
    updatePosition,
    saveHeroItems,
    toggleWatchlist,
    isInWatchlist,
  } = useMediaLibrary();

  const { isAdmin, login, logout } = useAdmin();

  // Fallback: open settings even if the footer prop isn't wired (HMR / stale props)
  useEffect(() => {
    const listener = () => setView('settings');
    window.addEventListener('gctv-open-settings', listener);
    return () => window.removeEventListener('gctv-open-settings', listener);
  }, []);

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

      // Go back to detail page
      setView('detail');
      setPlayerSeasonId(undefined);
      setPlayerEpisodeId(undefined);
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

  const currentLibrary = view === 'films' ? films : view === 'series' ? series : view === 'watchlist' ? watchlistMedia : library;
  const gridTitle = view === 'films' ? 'Films' : view === 'series' ? 'Séries' : view === 'watchlist' ? 'Ma Watchlist' : 'Tout le catalogue';
  const gridIcon = view === 'films' ? 'film' : view === 'series' ? 'serie' : view === 'watchlist' ? 'watchlist' : 'all';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        view={view}
        setView={setView}
        isAdmin={isAdmin}
        onAdminClick={() => setShowAdminLogin(true)}
        onLogout={logout}
        library={library}
        onSelectMedia={handleSelectMedia}
      />

      <main className="min-h-[calc(100vh-140px)]">
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
          />
        ) : (
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
            {view === 'home' && (
              <>
                {/* Admin Hero Editor Button */}
                {isAdmin && (
                  <div className="flex justify-end mb-4">
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
                
                <HeroSection 
                  heroItems={heroItems} 
                  onPlay={handlePlayHero}
                  onInfo={handleInfoHero}
                />
                
                {/* Resume Section - between Hero and Catalog */}
                <ResumeSection 
                  resumeList={resumeList}
                  onSelect={handleResumeSelect}
                />
              </>
            )}

            <MediaGrid
              title={gridTitle}
              icon={gridIcon as 'all' | 'film' | 'serie' | 'watchlist'}
              media={currentLibrary}
              loading={loading}
              isAdmin={isAdmin}
              layout={layout}
              onLayoutChange={handleLayoutChange}
              onSelect={handleSelectMedia}
              onAdd={handleAddMedia}
              onEdit={handleEditMedia}
              onDelete={deleteMedia}
            />
          </div>
        )}
      </main>

      {/* Global Ads - shown on all pages except settings */}
      {view !== 'settings' && <GlobalAds />}

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
