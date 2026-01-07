import { Play, Edit3, Trash2 } from 'lucide-react';
import type { Media } from '@/types/media';

interface MediaCardProps {
  media: Media;
  onSelect: (media: Media) => void;
  isAdmin?: boolean;
  onEdit?: (media: Media) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
  listMode?: boolean;
}

const MediaCard = ({ media, onSelect, isAdmin, onEdit, onDelete, compact, listMode }: MediaCardProps) => {
  // Get backdrop (horizontal) image for list mode, poster (vertical) for card mode
  const backdropImage = (media as any).backdrop || media.image;
  const posterImage = (media as any).poster || media.image;
  
  if (listMode) {
    return (
      <div 
        className="group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer bg-card border border-border/30 hover:border-primary/30 transition-all duration-300 flex h-24 sm:h-32"
        onClick={() => onSelect(media)}
      >
        {/* Image - Use backdrop (horizontal) for list mode */}
        <div className="w-20 sm:w-24 h-full flex-shrink-0 overflow-hidden">
          <img 
            src={backdropImage} 
            alt={media.title} 
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg ${
              media.type === 'Film' 
                ? 'bg-primary/80 text-primary-foreground' 
                : 'bg-accent/80 text-accent-foreground'
            }`}>
              {media.type}
            </span>
          </div>
          <h3 className="text-foreground font-bold truncate">{media.title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
            {media.description || 'Aucun synopsis'}
          </p>
        </div>

        {/* Play Button */}
        <div className="flex items-center pr-4">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Play size={18} fill="currentColor" className="text-primary-foreground ml-0.5" />
          </div>
        </div>
        
        {/* Admin Controls */}
        {isAdmin && (
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit?.(media); }}
              className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/80 transition-colors"
            >
              <Edit3 size={14} />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (confirm('Supprimer ce média ?')) onDelete?.(media.id); 
              }}
              className="p-2 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/80 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer bg-card border border-border/30 hover:border-primary/30 transition-all duration-300 hover-lift ${compact ? 'rounded-lg' : ''}`}
      onClick={() => onSelect(media)}
    >
      {/* Use poster (vertical 2:3) for card display */}
      <div className="aspect-[2/3] overflow-hidden">
        <img 
          src={posterImage} 
          alt={media.title} 
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
      </div>
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`rounded-full bg-primary/90 flex items-center justify-center glow-primary opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
            <Play size={compact ? 18 : 24} fill="currentColor" className="text-primary-foreground ml-1" />
          </div>
        </div>
        
        {!compact && (
          <div className="relative z-10">
            <p className="text-foreground text-sm font-bold truncate">{media.title}</p>
            <p className="text-muted-foreground text-xs line-clamp-2 mt-1">
              {media.description || 'Aucun synopsis'}
            </p>
          </div>
        )}
      </div>
      
      {/* Type Badge */}
      <div className={`absolute ${compact ? 'top-1 left-1' : 'top-3 left-3'}`}>
        <span className={`font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${compact ? 'text-[8px]' : 'text-[10px]'} ${
          media.type === 'Film' 
            ? 'bg-primary/80 text-primary-foreground' 
            : 'bg-accent/80 text-accent-foreground'
        }`}>
          {media.type}
        </span>
      </div>
      
      {/* Admin Controls */}
      {isAdmin && !compact && (
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit?.(media); }}
            className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/80 transition-colors"
          >
            <Edit3 size={14} />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (confirm('Supprimer ce média ?')) onDelete?.(media.id); 
            }}
            className="p-2 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/80 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaCard;
