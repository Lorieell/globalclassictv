import { useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import MediaCard from './MediaCard';
import type { Media } from '@/types/media';

interface MediaRowProps {
  title: string;
  media: Media[];
  onSelect: (media: Media) => void;
  onSeeMore?: () => void;
  isAdmin?: boolean;
  onEdit?: (media: Media) => void;
  onDelete?: (id: string) => void;
}

const MediaRow = ({ 
  title, 
  media, 
  onSelect, 
  onSeeMore,
  isAdmin,
  onEdit,
  onDelete 
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

  return (
    <section className="mb-8 group/section">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 px-2">
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
              className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
            >
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
