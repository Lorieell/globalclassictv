import { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/streaming/Header';
import HeroSection from '@/components/streaming/HeroSection';
import ResumeSection from '@/components/streaming/ResumeSection';
import MediaGrid from '@/components/streaming/MediaGrid';
import VideoPlayer from '@/components/streaming/VideoPlayer';
import AdminLoginModal from '@/components/streaming/AdminLoginModal';
import MediaEditorModal from '@/components/streaming/MediaEditorModal';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { useAdmin } from '@/hooks/useAdmin';
import type { Media } from '@/types/media';

type ViewType = 'home' | 'films' | 'series' | 'player';

const Index = () => {
  const [view, setView] = useState<ViewType>('home');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Partial<Media> | null>(null);

  const { 
    library, 
    films, 
    series, 
    heroItems, 
    resumeList,
    loading,
    addMedia,
    updateMedia,
    deleteMedia,
    updateProgress,
  } = useMediaLibrary();

  const { isAdmin, login, logout } = useAdmin();

  const handleSelectMedia = (media: Media) => {
    setSelectedMedia(media);
    setView('player');
  };

  const handlePlayHero = (mediaId: string) => {
    const media = library.find(m => m.id === mediaId);
    if (media) handleSelectMedia(media);
  };

  const handleBack = () => {
    setSelectedMedia(null);
    setView('home');
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

  const handleProgress = (mediaId: string, progress: number) => {
    updateProgress(mediaId, progress);
  };

  const currentLibrary = view === 'films' ? films : view === 'series' ? series : library;
  const gridTitle = view === 'films' ? 'Films' : view === 'series' ? 'Séries' : 'Tout le catalogue';
  const gridIcon = view === 'films' ? 'film' : view === 'series' ? 'serie' : 'all';

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
        {view === 'player' && selectedMedia ? (
          <VideoPlayer 
            media={selectedMedia} 
            onBack={handleBack}
            onProgress={handleProgress}
          />
        ) : (
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
            {view === 'home' && (
              <>
                <HeroSection 
                  heroItems={heroItems} 
                  onPlay={handlePlayHero}
                />
                
                <ResumeSection 
                  resumeList={resumeList}
                  onSelect={handleSelectMedia}
                />
              </>
            )}

            <MediaGrid
              title={gridTitle}
              icon={gridIcon as 'all' | 'film' | 'serie'}
              media={currentLibrary}
              loading={loading}
              isAdmin={isAdmin}
              onSelect={handleSelectMedia}
              onAdd={handleAddMedia}
              onEdit={handleEditMedia}
              onDelete={deleteMedia}
            />
          </div>
        )}
      </main>

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
    </div>
  );
};

export default Index;
