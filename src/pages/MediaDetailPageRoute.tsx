import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Plus, Check, Heart, Eye, Film, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/streaming/Header';
import Footer from '@/components/streaming/Footer';
import AdvancedAdLayout from '@/components/streaming/AdvancedAdLayout';
import { useSupabaseMedia } from '@/hooks/useSupabaseMedia';
import { useAdmin } from '@/hooks/useAdmin';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { generateSlug, findMediaBySlug } from '@/pages/CataloguePage';
import type { Media } from '@/types/media';
import { cn } from '@/lib/utils';

const MediaDetailPageRoute = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { 
    library, 
    loading, 
    isInWatchlist, 
    toggleWatchlist, 
    isInFavorites, 
    toggleFavorite,
    isSeen,
    toggleSeen 
  } = useSupabaseMedia();
  const { isAdmin, logout } = useAdmin();

  const [seenAnimating, setSeenAnimating] = useState(false);
  const [favoriteAnimating, setFavoriteAnimating] = useState(false);

  const media = slug ? findMediaBySlug(library, slug) : undefined;

  // Dynamic SEO meta tags
  const seoMeta = useMemo(() => {
    if (!media) return {};
    return {
      title: `${media.title} - Global Classic TV`,
      description: media.synopsis || media.description || `Regardez ${media.title} en streaming sur Global Classic TV`,
      image: (media as any).backdrop || media.image,
    };
  }, [media]);
  
  useDocumentMeta(seoMeta);

  useEffect(() => {
    if (!loading && !media && slug) {
      navigate('/catalogue');
    }
  }, [loading, media, slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!media) {
    return null;
  }

  const handleToggleSeen = () => {
    setSeenAnimating(true);
    toggleSeen(media.id);
    setTimeout(() => setSeenAnimating(false), 300);
  };

  const handleToggleFavorite = () => {
    setFavoriteAnimating(true);
    toggleFavorite(media.id);
    setTimeout(() => setFavoriteAnimating(false), 300);
  };

  const handlePlay = (seasonId?: string, episodeId?: string) => {
    const params = new URLSearchParams();
    if (seasonId) params.set('season', seasonId);
    if (episodeId) params.set('episode', episodeId);
    const queryString = params.toString();
    navigate(`/catalogue/${slug}/player${queryString ? `?${queryString}` : ''}`);
  };

  const handleSetView = (view: string) => {
    if (view === 'home') navigate('/');
    else if (view === 'films') navigate('/catalogue?type=films');
    else if (view === 'series') navigate('/catalogue?type=series');
  };

  const handleSelectMedia = (m: Media) => {
    navigate(`/catalogue/${generateSlug(m.title)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        view="detail"
        setView={handleSetView as any}
        isAdmin={isAdmin}
        onAdminClick={() => {}}
        onLogout={logout}
        library={library}
        onSelectMedia={handleSelectMedia}
      />
      
      <AdvancedAdLayout showAds={true}>
        <main className="pt-20 px-4 md:px-8 pb-20 max-w-[1400px] mx-auto animate-fade-in">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <span>/</span>
            <Link to="/catalogue" className="hover:text-primary transition-colors">Catalogue</Link>
            <span>/</span>
            <span className="text-foreground">{media.title}</span>
          </nav>

          {/* Main content grid - Image LEFT, Info RIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8 mb-12">
            {/* Left: Image */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Aperçu
              </h3>
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-card">
                <img 
                  src={media.image} 
                  alt={media.title}
                  className="w-full aspect-[2/3] object-cover"
                />
              </div>
            </div>

            {/* Right: Info */}
            <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-purple/5 p-6 shadow-lg">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-purple/10 opacity-50 blur-xl -z-10" />
              
              <div className="space-y-6">
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black uppercase text-foreground tracking-tight">
                  {media.title}
                </h1>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-2"
                    onClick={() => toggleWatchlist(media.id)}
                  >
                    {isInWatchlist(media.id) ? <Check size={16} /> : <Plus size={16} />}
                    {isInWatchlist(media.id) ? 'Dans la Watchlist' : 'Watchlist'}
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "rounded-xl gap-2 transition-all duration-300",
                      isInFavorites(media.id) 
                        ? "border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20" 
                        : "border-red-500/30 text-red-500/70 hover:bg-red-500/10 hover:text-red-500",
                      favoriteAnimating && "scale-110"
                    )}
                    onClick={handleToggleFavorite}
                  >
                    <Heart 
                      size={16} 
                      className={cn(
                        "transition-all duration-300",
                        isInFavorites(media.id) && "fill-red-500",
                        favoriteAnimating && "animate-pulse"
                      )} 
                    />
                    Favoris
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "rounded-xl gap-2 transition-all duration-300",
                      isSeen(media.id) 
                        ? "border-green-500 text-green-500 bg-green-500/10 hover:bg-green-500/20" 
                        : "border-muted-foreground/30 text-muted-foreground hover:bg-muted/10",
                      seenAnimating && "scale-110"
                    )}
                    onClick={handleToggleSeen}
                  >
                    <Eye 
                      size={16} 
                      className={cn(
                        "transition-all duration-300",
                        seenAnimating && "animate-pulse"
                      )}
                    />
                    {isSeen(media.id) ? 'Vu' : 'Marquer comme vu'}
                  </Button>
                </div>

                {/* Quality & Language */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {media.quality && (
                    <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="font-bold text-primary uppercase">Qualité : </span>
                      <span className="text-foreground">{media.quality}</span>
                    </div>
                  )}
                  {media.language && (
                    <div className="px-3 py-1 rounded-lg bg-purple/10 border border-purple/20">
                      <span className="font-bold text-purple uppercase">Langue : </span>
                      <span className="text-foreground">{media.language}</span>
                    </div>
                  )}
                </div>

                {/* Synopsis */}
                {(media.synopsis || media.description) && (
                  <div>
                    <h4 className="font-bold uppercase tracking-wide text-primary mb-2">Synopsis</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {media.synopsis || media.description}
                    </p>
                  </div>
                )}

                {/* Director & Actors */}
                {(media.director || media.actors) && (
                  <div className="flex flex-wrap gap-6 text-sm">
                    {media.director && (
                      <div className="flex items-center gap-2">
                        <Clapperboard size={14} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Réalisateur : </span>
                        <span className="text-foreground">{media.director}</span>
                      </div>
                    )}
                    {media.actors && (
                      <div className="flex items-center gap-2">
                        <Film size={14} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Acteurs : </span>
                        <span className="text-foreground">{media.actors}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Genres */}
                {media.genres && (
                  <div>
                    <h4 className="font-bold uppercase tracking-wide text-primary mb-2">Genres</h4>
                    <p className="text-muted-foreground">{media.genres}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
              Contenu
            </h3>

            <div className="flex flex-wrap gap-4">
              {/* Film button */}
              {media.videoUrls && (
                <button
                  onClick={() => handlePlay()}
                  className="group relative w-[180px] aspect-video rounded-xl border-2 border-primary/50 hover:border-primary overflow-hidden transition-all shadow-card hover:shadow-glow"
                >
                  <img 
                    src={media.image} 
                    alt="Film"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={24} className="text-primary" fill="currentColor" />
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="text-xs font-bold text-foreground">Film</span>
                  </div>
                </button>
              )}

              {/* Seasons buttons */}
              {media.seasons && media.seasons.length > 0 && media.seasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => handlePlay(season.id, season.episodes?.[0]?.id)}
                  className="group relative w-[180px] aspect-video rounded-xl border-2 border-primary/50 hover:border-primary overflow-hidden transition-all shadow-card hover:shadow-glow"
                >
                  <img 
                    src={media.image} 
                    alt={`Saison ${season.number}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={24} className="text-primary" fill="currentColor" />
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="text-xs font-bold text-foreground">Saison {season.number}</span>
                  </div>
                </button>
              ))}

              {/* Fallback */}
              {!media.videoUrls && (!media.seasons || media.seasons.length === 0) && (
                <p className="text-muted-foreground text-sm">Aucun contenu disponible</p>
              )}
            </div>
          </section>
        </main>
      </AdvancedAdLayout>
      
      <Footer />
    </div>
  );
};

export default MediaDetailPageRoute;
