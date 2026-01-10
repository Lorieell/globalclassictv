import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Plus, Check, Heart, Eye, Film, Clapperboard, Calendar, Globe, DollarSign, Users } from 'lucide-react';
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

// Format currency
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}Md $`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M $`;
  }
  return `${amount.toLocaleString('fr-FR')} $`;
};

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
    if (seasonId) {
      const season = media.seasons?.find(s => s.id === seasonId);
      const episode = season?.episodes?.find(e => e.id === episodeId) || season?.episodes?.[0];
      if (season && episode) {
        navigate(`/catalogue/${slug}/saison-${season.number}/episode-${episode.number}`);
        return;
      }
    }
    navigate(`/catalogue/${slug}/player`);
  };

  const handleSetView = (view: string) => {
    if (view === 'home') navigate('/');
    else if (view === 'films') navigate('/catalogue?type=films');
    else if (view === 'series') navigate('/catalogue?type=series');
  };

  const handleSelectMedia = (m: Media) => {
    navigate(`/catalogue/${generateSlug(m.title)}`);
  };

  // Get images - poster for vertical display, backdrop for horizontal
  const posterImage = (media as any).poster || media.image;
  const backdropImage = (media as any).backdrop || (media as any).poster || media.image;
  
  // Extended media info from DB
  const year = (media as any).year;
  const budget = (media as any).budget;
  const revenue = (media as any).revenue;
  const writers = (media as any).writers;
  const characters = (media as any).characters;
  const originalLanguage = (media as any).originalLanguage;
  const originalTitle = (media as any).originalTitle;
  const tagline = (media as any).tagline;
  const rating = (media as any).rating;
  const productionCompanies = (media as any).productionCompanies;
  const allGenres = media.genres;

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
          <div className="grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-6 lg:gap-8 mb-12">
            {/* Left: Poster Image (vertical) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Aperçu
              </h3>
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-card">
                <img 
                  src={posterImage} 
                  alt={media.title}
                  className="w-full aspect-[2/3] object-cover"
                />
              </div>
            </div>

            {/* Right: Info */}
            <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-purple/5 p-4 sm:p-6 shadow-lg">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-purple/10 opacity-50 blur-xl -z-10" />
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase text-foreground tracking-tight">
                    {media.title}
                  </h1>
                  {tagline && (
                    <p className="text-muted-foreground italic mt-1 text-sm">{tagline}</p>
                  )}
                </div>

                {/* Rating & Year */}
                <div className="flex flex-wrap items-center gap-3">
                  {rating && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                      <span className="text-yellow-500 font-bold">★</span>
                      <span className="text-foreground font-bold">{rating.toFixed(1)}</span>
                    </div>
                  )}
                  {year && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-secondary/50">
                      <Calendar size={14} className="text-muted-foreground" />
                      <span className="text-foreground text-sm">{year}</span>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    media.type === 'Film' 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-accent/20 text-accent-foreground'
                  }`}>
                    {media.type}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-2 text-xs sm:text-sm"
                    onClick={() => toggleWatchlist(media.id)}
                  >
                    {isInWatchlist(media.id) ? <Check size={14} /> : <Plus size={14} />}
                    {isInWatchlist(media.id) ? 'Ajouté' : 'Watchlist'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-xl gap-2 transition-all duration-300 text-xs sm:text-sm",
                      isInFavorites(media.id) 
                        ? "border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20" 
                        : "border-red-500/30 text-red-500/70 hover:bg-red-500/10 hover:text-red-500",
                      favoriteAnimating && "scale-110"
                    )}
                    onClick={handleToggleFavorite}
                  >
                    <Heart 
                      size={14} 
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
                    size="sm"
                    className={cn(
                      "rounded-xl gap-2 transition-all duration-300 text-xs sm:text-sm",
                      isSeen(media.id) 
                        ? "border-green-500 text-green-500 bg-green-500/10 hover:bg-green-500/20" 
                        : "border-muted-foreground/30 text-muted-foreground hover:bg-muted/10",
                      seenAnimating && "scale-110"
                    )}
                    onClick={handleToggleSeen}
                  >
                    <Eye 
                      size={14} 
                      className={cn(
                        "transition-all duration-300",
                        seenAnimating && "animate-pulse"
                      )}
                    />
                    {isSeen(media.id) ? 'Vu' : 'Marquer vu'}
                  </Button>
                </div>

                {/* Quality & Language */}
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                  {media.quality && (
                    <div className="px-2 sm:px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="font-bold text-primary uppercase">Qualité: </span>
                      <span className="text-foreground">{media.quality}</span>
                    </div>
                  )}
                  {media.language && (
                    <div className="px-2 sm:px-3 py-1 rounded-lg bg-purple/10 border border-purple/20">
                      <span className="font-bold text-purple uppercase">Langue: </span>
                      <span className="text-foreground">{media.language}</span>
                    </div>
                  )}
                  {originalLanguage && (
                    <div className="px-2 sm:px-3 py-1 rounded-lg bg-secondary/50 flex items-center gap-1">
                      <Globe size={12} className="text-muted-foreground" />
                      <span className="text-foreground">{originalLanguage.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* Synopsis */}
                {(media.synopsis || media.description) && (
                  <div>
                    <h4 className="font-bold uppercase tracking-wide text-primary mb-2 text-sm">Synopsis</h4>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {media.synopsis || media.description}
                    </p>
                  </div>
                )}

                {/* Director, Writers, Actors, Characters */}
                <div className="space-y-2 text-xs sm:text-sm">
                  {media.director && (
                    <div className="flex items-start gap-2">
                      <Clapperboard size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Réalisateur: </span>
                        <span className="text-foreground">{media.director}</span>
                      </div>
                    </div>
                  )}
                  {writers && (
                    <div className="flex items-start gap-2">
                      <Film size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Scénaristes: </span>
                        <span className="text-foreground">{writers}</span>
                      </div>
                    </div>
                  )}
                  {media.actors && (
                    <div className="flex items-start gap-2">
                      <Users size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Acteurs: </span>
                        <span className="text-foreground">{media.actors}</span>
                      </div>
                    </div>
                  )}
                  {characters && (
                    <div className="flex items-start gap-2">
                      <Users size={14} className="text-purple-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Personnages: </span>
                        <span className="text-foreground">{characters}</span>
                      </div>
                    </div>
                  )}
                  {productionCompanies && (
                    <div className="flex items-start gap-2">
                      <Film size={14} className="text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Production: </span>
                        <span className="text-foreground">{productionCompanies}</span>
                      </div>
                    </div>
                  )}
                  {originalTitle && originalTitle !== media.title && (
                    <div className="flex items-start gap-2">
                      <Globe size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Titre original: </span>
                        <span className="text-foreground italic">{originalTitle}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {allGenres && (
                  <div>
                    <h4 className="font-bold uppercase tracking-wide text-primary mb-2 text-sm">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {allGenres.split(',').map((genre, i) => (
                        <span key={i} className="px-2 py-1 rounded-lg bg-secondary/50 text-foreground text-xs">
                          {genre.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Budget & Revenue */}
                {(budget || revenue) && (
                  <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                    {budget && budget > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-green-500" />
                        <span className="text-muted-foreground">Budget: </span>
                        <span className="text-foreground font-medium">{formatCurrency(budget)}</span>
                      </div>
                    )}
                    {revenue && revenue > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-yellow-500" />
                        <span className="text-muted-foreground">Recettes: </span>
                        <span className="text-foreground font-medium">{formatCurrency(revenue)}</span>
                      </div>
                    )}
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

            <div className="flex flex-wrap gap-3 sm:gap-4">
              {/* Film button - Use backdrop for horizontal thumbnail */}
              {media.videoUrls && (
                <button
                  onClick={() => handlePlay()}
                  className="group relative w-[140px] sm:w-[180px] aspect-video rounded-xl border-2 border-primary/50 hover:border-primary overflow-hidden transition-all shadow-card hover:shadow-glow"
                >
                  <img 
                    src={backdropImage} 
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

              {/* Seasons buttons - Use backdrop for horizontal thumbnail */}
              {media.seasons && media.seasons.length > 0 && media.seasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => handlePlay(season.id, season.episodes?.[0]?.id)}
                  className="group relative w-[140px] sm:w-[180px] aspect-video rounded-xl border-2 border-primary/50 hover:border-primary overflow-hidden transition-all shadow-card hover:shadow-glow"
                >
                  <img 
                    src={backdropImage} 
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
