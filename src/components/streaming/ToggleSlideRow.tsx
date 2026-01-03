import { useRef, useState, ReactNode } from 'react';
import { ChevronRight, ChevronLeft, Play, Plus, Info, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Media } from '@/types/media';

interface ToggleSlideRowProps {
  title: string;
  titleIcon?: ReactNode;
  media: Media[]; // Films only
  onSelect: (media: Media) => void;
  onPlay: (media: Media) => void;
  onAddToWatchlist: (mediaId: string) => void;
  isInWatchlist: (mediaId: string) => boolean;
  onSeeMore?: () => void;
}

const ToggleSlideRow = ({
  title,
  titleIcon,
  media,
  onSelect,
  onPlay,
  onAddToWatchlist,
  isInWatchlist,
  onSeeMore,
}: ToggleSlideRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(updateScrollButtons, 400);
  };

  // Only show films
  const filmsOnly = media.filter(m => m.type === 'Film');
  
  if (filmsOnly.length === 0) return null;

  return (
    <section className="mb-10 group/section">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-2">
        {titleIcon}
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          {title}
        </h2>
        {onSeeMore && (
          <button 
            onClick={onSeeMore}
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group/btn"
          >
            <span className="text-sm font-medium">Voir plus</span>
            <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative group/carousel">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-r from-background to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full bg-card/90 border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-colors">
              <ChevronLeft size={24} className="text-foreground" />
            </div>
          </button>
        )}

        {/* Media Items */}
        <div 
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-2"
          style={{ paddingBottom: '8px' }}
        >
          {filmsOnly.map((item) => {
            const isHovered = hoveredId === item.id;
            const backdrop = (item as any).backdrop || item.image;
            
            return (
              <div 
                key={item.id}
                className="flex-shrink-0 relative transition-all duration-500 ease-out"
                style={{
                  width: isHovered ? '420px' : '160px',
                  height: '240px',
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Collapsed State - Poster */}
                <div 
                  className={`absolute inset-0 rounded-xl overflow-hidden transition-all duration-500 cursor-pointer ${
                    isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                  onClick={() => onSelect(item)}
                >
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/90 text-primary-foreground">
                      NOUVEAU FILM
                    </span>
                  </div>
                </div>

                {/* Expanded State - Backdrop with Controls */}
                <div 
                  className={`absolute inset-0 rounded-xl overflow-hidden transition-all duration-500 ${
                    isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {/* Backdrop Image or Video Preview */}
                  <div className="absolute inset-0">
                    <img 
                      src={backdrop} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Video Preview Overlay - Shows trailer if available */}
                    {item.videoUrls && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="w-8 h-8 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center">
                          <VolumeX size={14} className="text-foreground/70" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlay(item);
                        }}
                        className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4 py-2 text-xs font-bold gap-1.5"
                      >
                        <Play size={14} fill="currentColor" />
                        Lecture
                      </Button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToWatchlist(item.id);
                        }}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                          isInWatchlist(item.id)
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background/50 border-border/50 text-foreground hover:border-foreground'
                        }`}
                      >
                        <Plus size={16} className={isInWatchlist(item.id) ? 'rotate-45' : ''} />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(item);
                        }}
                        className="w-8 h-8 rounded-full bg-background/50 border border-border/50 flex items-center justify-center hover:border-foreground transition-colors"
                      >
                        <Info size={14} className="text-foreground" />
                      </button>
                    </div>
                    
                    {/* Meta Info */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.quality && (
                        <span className="px-1.5 py-0.5 rounded border border-border/50 text-foreground font-medium">
                          {item.quality}
                        </span>
                      )}
                      {item.language && (
                        <span className="text-muted-foreground">{item.language}</span>
                      )}
                      {item.genres && (
                        <span className="text-muted-foreground truncate max-w-[150px]">
                          {item.genres.split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-l from-background to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full bg-card/90 border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-colors">
              <ChevronRight size={24} className="text-foreground" />
            </div>
          </button>
        )}
      </div>
    </section>
  );
};

export default ToggleSlideRow;
