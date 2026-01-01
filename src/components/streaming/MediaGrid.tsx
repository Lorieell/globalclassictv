import { useEffect, useRef } from 'react';
import { Plus, Film, Tv, LayoutGrid, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MediaCard from './MediaCard';
import LayoutToggle, { type LayoutType } from './LayoutToggle';
import type { Media } from '@/types/media';

interface MediaGridProps {
  title: string;
  icon?: 'all' | 'film' | 'serie' | 'watchlist';
  media: Media[];
  loading?: boolean;
  isAdmin?: boolean;
  layout?: LayoutType;
  onLayoutChange?: (layout: LayoutType) => void;
  onSelect: (media: Media) => void;
  onAdd?: () => void;
  onEdit?: (media: Media) => void;
  onDelete?: (id: string) => void;
}

const MediaGrid = ({ 
  title, 
  icon = 'all',
  media, 
  loading, 
  isAdmin,
  layout = 'grid',
  onLayoutChange,
  onSelect,
  onAdd,
  onEdit,
  onDelete 
}: MediaGridProps) => {
  const Icon = icon === 'film' ? Film : icon === 'serie' ? Tv : icon === 'watchlist' ? Bookmark : LayoutGrid;
  const carouselRef = useRef<HTMLDivElement>(null);

  // Auto-scroll carousel
  useEffect(() => {
    if (layout !== 'carousel' || !carouselRef.current) return;

    let scrollDirection = 1;
    const scrollSpeed = 1;
    const container = carouselRef.current;

    const interval = setInterval(() => {
      if (!container) return;
      
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      if (container.scrollLeft >= maxScroll - 10) {
        scrollDirection = -1;
      } else if (container.scrollLeft <= 10) {
        scrollDirection = 1;
      }
      
      container.scrollLeft += scrollSpeed * scrollDirection;
    }, 30);

    return () => clearInterval(interval);
  }, [layout]);

  const getGridClass = () => {
    switch (layout) {
      case 'carousel':
        return 'flex gap-4 overflow-x-auto scrollbar-hide pb-4';
      case 'list':
        return 'flex flex-col gap-4';
      case 'compact':
        return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2';
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';
    }
  };

  const getCardStyle = () => {
    switch (layout) {
      case 'carousel':
        return 'flex-shrink-0 w-[180px]';
      case 'list':
        return 'flex-row h-32';
      case 'compact':
        return 'scale-90';
      default:
        return '';
    }
  };

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold uppercase flex items-center gap-3 text-foreground tracking-wide">
          <Icon size={24} className="text-primary" />
          {title}
        </h2>
        
        <div className="flex items-center gap-3">
          {isAdmin && onLayoutChange && (
            <LayoutToggle currentLayout={layout} onChange={onLayoutChange} />
          )}
          
          {isAdmin && onAdd && (
            <Button 
              onClick={onAdd}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl font-semibold text-sm gap-2"
            >
              <Plus size={18} />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className={getGridClass()}>
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className={`aspect-[2/3] rounded-2xl bg-muted animate-pulse ${layout === 'carousel' ? 'flex-shrink-0 w-[180px]' : ''}`}
            />
          ))}
        </div>
      ) : media.length > 0 ? (
        <div 
          ref={carouselRef}
          className={getGridClass()}
          style={layout === 'carousel' ? { scrollBehavior: 'smooth' } : undefined}
        >
          {media.map(item => (
            <div key={item.id} className={getCardStyle()}>
              <MediaCard 
                media={item}
                onSelect={onSelect}
                isAdmin={isAdmin}
                onEdit={onEdit}
                onDelete={onDelete}
                compact={layout === 'compact'}
                listMode={layout === 'list'}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card/50 rounded-3xl border border-border/50">
          <p className="text-muted-foreground">Aucun contenu disponible.</p>
        </div>
      )}
    </section>
  );
};

export default MediaGrid;
