import { useState, useEffect } from 'react';
import { ChevronLeft, Play, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Media, Season, Episode } from '@/types/media';

interface VideoPlayerProps {
  media: Media;
  onBack: () => void;
  onProgress?: (mediaId: string, progress: number) => void;
}

const VideoPlayer = ({ media, onBack, onProgress }: VideoPlayerProps) => {
  const isSerie = media.type === 'Série';
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(
    isSerie && media.seasons?.[0] ? media.seasons[0] : null
  );
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(
    selectedSeason?.episodes?.[0] ?? null
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  const currentEpisode = isSerie ? selectedEpisode : null;
  const videoUrls = (currentEpisode?.videoUrls || media.videoUrls || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const currentUrl = videoUrls[sourceIndex] || '';

  // Simulate progress for demo
  useEffect(() => {
    if (currentUrl && onProgress) {
      const timeout = setTimeout(() => {
        onProgress(media.id, Math.floor(Math.random() * 60) + 20);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [currentUrl, media.id, onProgress]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in-up">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 text-muted-foreground hover:text-foreground gap-2 -ml-2"
      >
        <ChevronLeft size={20} />
        Retour au catalogue
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Player */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-card rounded-3xl overflow-hidden shadow-card border border-border/50 relative">
            {currentUrl ? (
              <iframe 
                src={currentUrl} 
                className="w-full h-full" 
                allowFullScreen 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                <Play size={64} className="opacity-30" />
                <p className="text-sm">Aucune source vidéo disponible</p>
              </div>
            )}
          </div>

          {/* Source Selector */}
          {videoUrls.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {videoUrls.map((_, i) => (
                <Button
                  key={i}
                  variant={sourceIndex === i ? 'default' : 'outline'}
                  onClick={() => setSourceIndex(i)}
                  className={`rounded-xl ${sourceIndex === i ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 border-border/50'}`}
                >
                  Lecteur {i + 1}
                </Button>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="space-y-3">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {media.title}
            </h1>
            {isSerie && selectedEpisode && (
              <p className="text-primary font-semibold text-lg">
                Saison {selectedSeason?.number} - Épisode {selectedEpisode.number}: {selectedEpisode.title}
              </p>
            )}
            <p className="text-muted-foreground leading-relaxed">
              {media.description || 'Aucune description disponible pour ce programme.'}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {isSerie && media.seasons && media.seasons.length > 0 ? (
            <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-card">
              <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-3 text-foreground uppercase tracking-wide">
                <Tv size={20} className="text-primary" />
                Épisodes
              </h3>

              {/* Season Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-border/50 scrollbar-hide">
                {media.seasons.map((season) => (
                  <Button
                    key={season.id}
                    variant={selectedSeason?.number === season.number ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedSeason(season);
                      setSelectedEpisode(season.episodes?.[0] ?? null);
                      setSourceIndex(0);
                    }}
                    className={`rounded-xl whitespace-nowrap ${
                      selectedSeason?.number === season.number 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary/50 border-border/50'
                    }`}
                  >
                    Saison {season.number}
                  </Button>
                ))}
              </div>

              {/* Episodes List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide pr-1">
                {selectedSeason?.episodes?.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => { setSelectedEpisode(ep); setSourceIndex(0); }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                      selectedEpisode?.id === ep.id 
                        ? 'bg-primary/20 border border-primary/30' 
                        : 'bg-secondary/30 hover:bg-secondary/50 border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      selectedEpisode?.id === ep.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {ep.number}
                    </div>
                    <span className="truncate text-sm font-medium text-foreground">
                      {ep.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden shadow-card border border-border/50">
              <img 
                src={media.image} 
                alt={media.title}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
