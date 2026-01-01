import { Plus, Film, Tv, LayoutGrid, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MediaCard from './MediaCard';
import type { Media } from '@/types/media';

interface MediaGridProps {
  title: string;
  icon?: 'all' | 'film' | 'serie' | 'watchlist';
  media: Media[];
  loading?: boolean;
  isAdmin?: boolean;
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
  onSelect,
  onAdd,
  onEdit,
  onDelete 
}: MediaGridProps) => {
  const Icon = icon === 'film' ? Film : icon === 'serie' ? Tv : icon === 'watchlist' ? Bookmark : LayoutGrid;

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold uppercase flex items-center gap-3 text-foreground tracking-wide">
          <Icon size={24} className="text-primary" />
          {title}
        </h2>
        
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

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="aspect-[2/3] rounded-2xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : media.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {media.map(item => (
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
      ) : (
        <div className="text-center py-20 bg-card/50 rounded-3xl border border-border/50">
          <p className="text-muted-foreground">Aucun contenu disponible.</p>
        </div>
      )}
    </section>
  );
};

export default MediaGrid;
