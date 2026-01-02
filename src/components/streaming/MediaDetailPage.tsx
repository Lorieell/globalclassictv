import { useState } from 'react';
import { ChevronLeft, Play, Plus, Check, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Media } from '@/types/media';
import { cn } from '@/lib/utils';

interface MediaDetailPageProps {
  media: Media;
  onBack: () => void;
  onPlay: (media: Media, seasonId?: string, episodeId?: string) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (mediaId: string) => void;
  isInFavorites: boolean;
  onToggleFavorite: (mediaId: string) => void;
  isSeen: boolean;
  onToggleSeen: (mediaId: string) => void;
}

const MediaDetailPage = ({ 
  media, 
  onBack, 
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
  isInFavorites,
  onToggleFavorite,
  isSeen,
  onToggleSeen,
}: MediaDetailPageProps) => {
  const [seenAnimating, setSeenAnimating] = useState(false);
  const [favoriteAnimating, setFavoriteAnimating] = useState(false);

  const handleToggleSeen = () => {
    setSeenAnimating(true);
    onToggleSeen(media.id);
    setTimeout(() => setSeenAnimating(false), 300);
  };

  const handleToggleFavorite = () => {
    setFavoriteAnimating(true);
    onToggleFavorite(media.id);
    setTimeout(() => setFavoriteAnimating(false), 300);
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in p-4 md:p-8 max-w-[1400px] mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 text-muted-foreground hover:text-foreground gap-2 -ml-2"
      >
        <ChevronLeft size={20} />
        Retour
      </Button>

      {/* Main content grid - Image LEFT, Info RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8 mb-12">
        {/* Left: Aperçu label + Image (clickable) */}
        <div>
          <h3 
            onClick={onBack}
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 cursor-pointer hover:text-primary transition-colors"
          >
            Aperçu
          </h3>
          <div 
            onClick={onBack}
            className="rounded-2xl overflow-hidden border border-border/50 shadow-card cursor-pointer hover:border-primary/50 transition-all"
          >
            <img 
              src={media.image} 
              alt={media.title}
              className="w-full aspect-[2/3] object-cover"
            />
          </div>
        </div>

        {/* Right: Info with visual distinction */}
        <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-purple/5 p-6 shadow-lg">
          {/* Decorative glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-purple/10 opacity-50 blur-xl -z-10" />
          
          <div className="space-y-6">
            <h1 
              onClick={onBack}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-black uppercase text-foreground tracking-tight cursor-pointer hover:text-primary transition-colors"
            >
              {media.title}
            </h1>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-2"
                onClick={() => onToggleWatchlist(media.id)}
              >
                {isInWatchlist ? <Check size={16} /> : <Plus size={16} />}
                {isInWatchlist ? 'Dans la Watchlist' : 'Watchlist'}
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "rounded-xl gap-2 transition-all duration-300",
                  isInFavorites 
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
                    isInFavorites && "fill-red-500",
                    favoriteAnimating && "animate-pulse"
                  )} 
                />
                {isInFavorites ? 'Favoris ♥' : 'Favoris'}
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "rounded-xl gap-2 transition-all duration-300",
                  isSeen 
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
                {isSeen ? 'Vu ✓' : 'Marquer comme vu'}
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

      {/* Content Section - Films and/or Series */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
          Contenu
        </h3>

        <div className="flex flex-wrap gap-4">
          {/* Film button - show if has videoUrls */}
          {media.videoUrls && (
            <button
              onClick={() => onPlay(media)}
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

          {/* Seasons buttons - show if has seasons */}
          {media.seasons && media.seasons.length > 0 && media.seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => onPlay(media, season.id)}
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

          {/* Fallback if nothing */}
          {!media.videoUrls && (!media.seasons || media.seasons.length === 0) && (
            <p className="text-muted-foreground text-sm">Aucun contenu disponible</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MediaDetailPage;
