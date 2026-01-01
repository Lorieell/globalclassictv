import { Play, Edit3, Trash2 } from 'lucide-react';
import type { Media } from '@/types/media';

interface MediaCardProps {
  media: Media;
  onSelect: (media: Media) => void;
  isAdmin?: boolean;
  onEdit?: (media: Media) => void;
  onDelete?: (id: string) => void;
}

const MediaCard = ({ media, onSelect, isAdmin, onEdit, onDelete }: MediaCardProps) => {
  return (
    <div 
      className="group relative rounded-2xl overflow-hidden cursor-pointer bg-card border border-border/30 hover:border-primary/30 transition-all duration-300 hover-lift"
      onClick={() => onSelect(media)}
    >
      <div className="aspect-[2/3] overflow-hidden">
        <img 
          src={media.image} 
          alt={media.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
      </div>
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center glow-primary opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
            <Play size={24} fill="currentColor" className="text-primary-foreground ml-1" />
          </div>
        </div>
        
        <div className="relative z-10">
          <p className="text-foreground text-sm font-bold truncate">{media.title}</p>
          <p className="text-muted-foreground text-xs line-clamp-2 mt-1">
            {media.description || 'Aucun synopsis'}
          </p>
        </div>
      </div>
      
      {/* Type Badge */}
      <div className="absolute top-3 left-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
          media.type === 'Film' 
            ? 'bg-primary/80 text-primary-foreground' 
            : 'bg-accent/80 text-accent-foreground'
        }`}>
          {media.type}
        </span>
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
};

export default MediaCard;
