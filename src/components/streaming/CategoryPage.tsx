import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MediaCard from './MediaCard';
import type { Media } from '@/types/media';

interface CategoryPageProps {
  title: string;
  media: Media[];
  onBack: () => void;
  onSelect: (media: Media) => void;
  isAdmin?: boolean;
  onEdit?: (media: Media) => void;
  onDelete?: (id: string) => void;
}

const CategoryPage = ({ 
  title, 
  media, 
  onBack, 
  onSelect,
  isAdmin,
  onEdit,
  onDelete 
}: CategoryPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border/30 py-4 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full hover:bg-primary/10"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h1>
          <span className="text-muted-foreground text-sm">
            {media.length} titre{media.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        {media.length > 0 ? (
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
            <p className="text-muted-foreground">Aucun contenu dans cette catégorie.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
