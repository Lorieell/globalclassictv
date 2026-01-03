import { useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import MediaCard from './MediaCard';
import type { Media } from '@/types/media';

export type RowLayoutType = 'scroll' | 'grid' | 'compact' | 'featured';

interface MediaRowProps {
  title: string;
  titleIcon?: ReactNode;
  media: Media[];
  onSelect: (media: Media) => void;
  onSeeMore?: () => void;
  isAdmin?: boolean;
  onEdit?: (media: Media) => void;
  onDelete?: (id: string) => void;
  layout?: RowLayoutType;
  // For watchlist/favorites removal
  onRemove?: (mediaId: string) => void;
  showRemoveButton?: boolean;
}

const MediaRow = ({ 
  title, 
  titleIcon,
  media, 
  onSelect, 
  onSeeMore,
  isAdmin,
  onEdit,
  onDelete,
  layout = 'scroll',
  onRemove,
  showRemoveButton = false
}: MediaRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  if (media.length === 0) return null;

  // Grid Layout - displays items in a responsive grid
  if (layout === 'grid') {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4 px-2">
          {titleIcon}
          <h2 className="text-lg md:text-xl font-bold text-foreground">{title}</h2>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-2">
          {media.slice(0, 12).map(item => (
            <MediaCard 
              key={item.id}
              media={item}
              onSelect={onSelect}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </section>
    );
  }

  // Compact Layout - smaller cards in a denser grid
  if (layout === 'compact') {
    return (
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-2">
          {titleIcon}
          <h2 className="text-base md:text-lg font-bold text-foreground">{title}</h2>
          {onSeeMore && (
            <button 
              onClick={onSeeMore}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group/btn"
            >
              <span className="text-xs font-medium">Voir plus</span>
              <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 px-2">
          {media.slice(0, 20).map(item => (
            <div 
              key={item.id}
              className="group cursor-pointer"
              onClick={() => onSelect(item)}
            >
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border/30 hover:border-primary/50 transition-all duration-300">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">{item.title}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Featured Layout - first item large, rest in a row
  if (layout === 'featured') {
    const [featured, ...rest] = media;
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4 px-2">
          {titleIcon}
          <h2 className="text-lg md:text-xl font-bold text-foreground">{title}</h2>
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
          {/* Featured large card */}
          <div 
            className="md:col-span-1 lg:col-span-1 md:row-span-2 group cursor-pointer"
            onClick={() => onSelect(featured)}
          >
            <div className="aspect-[2/3] md:aspect-auto md:h-full rounded-2xl overflow-hidden bg-card border border-border/30 hover:border-primary/50 transition-all duration-300 relative">
              <img 
                src={featured.image} 
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg font-bold text-white">{featured.title}</h3>
                <div className="flex gap-2 mt-2">
                  {featured.quality && (
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/80 text-primary-foreground">{featured.quality}</span>
                  )}
                  {featured.language && (
                    <span className="text-xs px-2 py-0.5 rounded bg-secondary/80 text-secondary-foreground">{featured.language}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Rest in grid */}
          <div className="md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {rest.slice(0, 8).map(item => (
              <MediaCard 
                key={item.id}
                media={item}
                onSelect={onSelect}
                isAdmin={isAdmin}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default Scroll Layout
  return (
    <section className="mb-8 group/section">
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
            className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-background to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
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
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-2"
        >
          {media.map(item => (
            <div 
              key={item.id} 
              className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] relative group/card"
            >
              {/* Remove button for watchlist/favorites */}
              {showRemoveButton && onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-destructive"
                >
                  <X size={14} />
                </button>
              )}
              <MediaCard 
                media={item}
                onSelect={onSelect}
                isAdmin={isAdmin}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-background to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
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

export default MediaRow;
