import { useState } from 'react';
import { ChevronLeft, Play, Plus, Check, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Media, Season } from '@/types/media';

interface MediaDetailPageProps {
  media: Media;
  onBack: () => void;
  onPlay: (media: Media, seasonId?: string, episodeId?: string) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (mediaId: string) => void;
}

const MediaDetailPage = ({ 
  media, 
  onBack, 
  onPlay,
  isInWatchlist,
  onToggleWatchlist 
}: MediaDetailPageProps) => {
  const isSerie = media.type === 'Série';

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
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
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-8 mb-12">
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
              className="rounded-2xl overflow-hidden border border-border/50 shadow-card cursor-pointer hover:border-primary/50 transition-all max-w-[350px]"
            >
              <img 
                src={media.image} 
                alt={media.title}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>
          </div>

          {/* Right: Info */}
          <div className="space-y-6">
            <h1 
              onClick={onBack}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-black uppercase text-foreground tracking-tight cursor-pointer hover:text-primary transition-colors"
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
                className="rounded-xl border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 gap-2"
              >
                <Star size={16} />
                Favoris
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-muted-foreground/30 text-muted-foreground hover:bg-muted/10 gap-2"
              >
                <Eye size={16} />
                Vu
              </Button>
            </div>

            {/* Quality & Language */}
            <div className="flex flex-wrap gap-4 text-sm">
              {media.quality && (
                <div>
                  <span className="font-bold text-muted-foreground uppercase">Qualité : </span>
                  <span className="text-foreground">{media.quality}</span>
                </div>
              )}
              {media.language && (
                <div>
                  <span className="font-bold text-muted-foreground uppercase">Langue : </span>
                  <span className="text-foreground">{media.language}</span>
                </div>
              )}
            </div>

            {/* Synopsis */}
            {(media.synopsis || media.description) && (
              <div>
                <h4 className="font-bold uppercase tracking-wide text-foreground mb-2">Synopsis</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {media.synopsis || media.description}
                </p>
              </div>
            )}

            {/* Genres */}
            {media.genres && (
              <div>
                <h4 className="font-bold uppercase tracking-wide text-foreground mb-2">Genres</h4>
                <p className="text-muted-foreground">{media.genres}</p>
              </div>
            )}
          </div>
        </div>

        {/* Content Section - Films or Series */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
            {isSerie ? 'Saisons' : 'Contenu'}
          </h3>

          <div className="flex flex-wrap gap-4">
            {isSerie && media.seasons && media.seasons.length > 0 ? (
              media.seasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => onPlay(media, season.id)}
                  className="group relative min-w-[120px] aspect-video bg-primary/10 backdrop-blur-sm rounded-xl border-2 border-primary/50 hover:border-primary overflow-hidden transition-all shadow-card hover:shadow-glow"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={24} className="text-primary" fill="currentColor" />
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="text-xs font-bold text-foreground">Saison {season.number}</span>
                  </div>
                </button>
              ))
            ) : (
              <button
                onClick={() => onPlay(media)}
                className="group relative min-w-[120px] aspect-video bg-primary/10 backdrop-blur-sm rounded-xl border-2 border-primary/50 hover:border-primary overflow-hidden transition-all shadow-card hover:shadow-glow"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={24} className="text-primary" fill="currentColor" />
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-xs font-bold text-foreground">Film</span>
                </div>
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MediaDetailPage;
