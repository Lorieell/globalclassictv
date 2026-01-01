import { useState, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Media } from '@/types/media';

interface ResumeSectionProps {
  resumeList: (Media & { progress: number })[];
  onSelect: (media: Media) => void;
}

const ResumeSection = ({ resumeList, onSelect }: ResumeSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (resumeList.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="mb-12 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold uppercase flex items-center gap-3 text-foreground tracking-wide">
          <div className="w-1.5 h-8 bg-primary rounded-full glow-primary" />
          Reprendre la lecture
        </h2>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="rounded-xl border-border/50 bg-secondary/50 hover:bg-secondary"
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="rounded-xl border-border/50 bg-secondary/50 hover:bg-secondary"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2"
      >
        {resumeList.map((media) => (
          <div 
            key={media.id}
            onClick={() => onSelect(media)}
            className="min-w-[280px] md:min-w-[320px] flex-shrink-0 group cursor-pointer"
          >
            <div className="relative aspect-video bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-card hover-lift">
              <img 
                src={media.image} 
                alt={media.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center glow-primary">
                  <Play size={28} fill="currentColor" className="text-primary-foreground ml-1" />
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                <div 
                  className="h-full bg-primary transition-all duration-500 glow-primary"
                  style={{ width: `${media.progress}%` }}
                />
              </div>

              {/* Progress percentage */}
              <div className="absolute top-3 left-3">
                <span className="text-xs font-bold text-foreground/70 uppercase tracking-widest bg-background/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                  {media.progress}% vu
                </span>
              </div>
            </div>
            
            <div className="mt-3 px-1">
              <h4 className="text-sm font-bold text-foreground truncate">{media.title}</h4>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                Continuer la lecture
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ResumeSection;
