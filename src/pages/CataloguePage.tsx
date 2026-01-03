import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Film, Tv, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/streaming/Header';
import Footer from '@/components/streaming/Footer';
import MediaCard from '@/components/streaming/MediaCard';
import AdvancedAdLayout from '@/components/streaming/AdvancedAdLayout';
import { useSupabaseMedia } from '@/hooks/useSupabaseMedia';
import { useAdmin } from '@/hooks/useAdmin';
import type { Media } from '@/types/media';

// Generate URL-friendly slug from title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .trim();
};

// Find media by slug
export const findMediaBySlug = (library: Media[], slug: string): Media | undefined => {
  return library.find(m => generateSlug(m.title) === slug);
};

const CataloguePage = () => {
  const { library, loading } = useSupabaseMedia();
  const { isAdmin, logout } = useAdmin();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'films' | 'series'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredMedia = library.filter(media => {
    const matchesSearch = searchQuery.trim() === '' || 
      media.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      media.genres?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || 
      (filterType === 'films' && media.type === 'Film') ||
      (filterType === 'series' && media.type === 'Série');
    
    return matchesSearch && matchesType;
  });

  const handleMediaClick = (media: Media) => {
    navigate(`/catalogue/${generateSlug(media.title)}`);
  };

  const handleSetView = (view: string) => {
    if (view === 'home') navigate('/');
    else if (view === 'films') setFilterType('films');
    else if (view === 'series') setFilterType('series');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        view="home"
        setView={handleSetView as any}
        isAdmin={isAdmin}
        onAdminClick={() => {}}
        onLogout={logout}
        library={library}
        onSelectMedia={handleMediaClick}
      />
      
      <AdvancedAdLayout showAds={true}>
        <main className="pt-20 px-4 md:px-8 pb-20 max-w-[1600px] mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-foreground">Catalogue</span>
          </nav>

          <h1 className="font-display text-4xl md:text-5xl font-black uppercase text-primary mb-8">
            Catalogue
          </h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className="gap-2"
              >
                Tout
              </Button>
              <Button
                variant={filterType === 'films' ? 'default' : 'outline'}
                onClick={() => setFilterType('films')}
                className="gap-2"
              >
                <Film size={16} />
                Films
              </Button>
              <Button
                variant={filterType === 'series' ? 'default' : 'outline'}
                onClick={() => setFilterType('series')}
                className="gap-2"
              >
                <Tv size={16} />
                Séries
              </Button>
            </div>

            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </Button>
            </div>
          </div>

          {/* Results count */}
          <p className="text-muted-foreground text-sm mb-6">
            {filteredMedia.length} résultat{filteredMedia.length !== 1 ? 's' : ''}
          </p>

          {/* Media Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredMedia.map(media => (
                <MediaCard
                  key={media.id}
                  media={media}
                  onSelect={handleMediaClick}
                  isAdmin={false}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMedia.map(media => (
                <MediaCard
                  key={media.id}
                  media={media}
                  onSelect={handleMediaClick}
                  isAdmin={false}
                  listMode
                />
              ))}
            </div>
          )}

          {filteredMedia.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Aucun contenu trouvé</p>
            </div>
          )}
        </main>
      </AdvancedAdLayout>
      
      <Footer />
    </div>
  );
};

export default CataloguePage;
