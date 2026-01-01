import { useEffect, useState, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Media } from '@/types/media';

interface ResumeSectionProps {
  resumeList: (Media & { progress: number })[];
  onSelect: (media: Media) => void;
}

const ResumeSection = ({ resumeList, onSelect }: ResumeSectionProps) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const itemsPerSlide = 5;
  const containerRef = useRef<HTMLDivElement>(null);
  const [stepPx, setStepPx] = useState(0);

  const maxIndex = Math.max(0, resumeList.length - itemsPerSlide);

  const goLeft = () => setSlideIndex((prev) => Math.max(0, prev - 1));
  const goRight = () => setSlideIndex((prev) => Math.min(maxIndex, prev + 1));

  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const items = el.querySelectorAll<HTMLElement>('[data-resume-item]');
      if (items.length >= 2) {
        setStepPx(items[1].offsetLeft - items[0].offsetLeft);
        return;
      }
      if (items.length === 1) {
        setStepPx(items[0].getBoundingClientRect().width);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [resumeList.length]);

  if (resumeList.length === 0) return null;

  return (
    <section className="mb-16 relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-xl md:text-2xl font-black italic uppercase flex items-center gap-3 text-foreground tracking-wide">
          <div className="w-1.5 h-6 bg-primary rounded-full glow-primary" />
          Reprendre la lecture
        </h2>
        
        {/* Manual Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goLeft}
            disabled={slideIndex === 0}
            className="rounded-xl border-border/30 bg-card hover:bg-secondary disabled:opacity-20"
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goRight}
            disabled={slideIndex >= maxIndex}
            className="rounded-xl border-border/30 bg-card hover:bg-secondary disabled:opacity-20"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* Slider Window */}
      <div className="overflow-hidden p-2 -m-2" ref={containerRef}>
        <div 
          className="flex w-full transition-transform duration-[800ms] ease-[cubic-bezier(0.2,1,0.3,1)] gap-5"
          style={{
            transform:
              stepPx > 0
                ? `translateX(-${slideIndex * stepPx}px)`
                : `translateX(-${slideIndex * (100 / itemsPerSlide)}%)`,
          }}
        >
          {resumeList.map((media) => (
            <div
              key={media.id}
              data-resume-item
              onClick={() => onSelect(media)}
              className="flex-[0_0_calc((100%_-_5rem)/5)] max-w-[calc((100%_-_5rem)/5)] flex-shrink-0 group cursor-pointer"
            >
              <div className="aspect-video bg-card rounded-3xl border border-border/30 overflow-hidden relative hover:border-primary/50 transition-all shadow-card">
                {/* Image */}
                <img 
                  src={media.image} 
                  alt={media.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center glow-primary">
                    <Play size={24} fill="currentColor" className="text-primary-foreground ml-1" />
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                  <div 
                    className="h-full bg-primary transition-all glow-primary"
                    style={{ width: `${media.progress}%` }}
                  />
                </div>

                {/* Progress Percentage */}
                <div className="absolute top-3 left-4">
                  <div className="text-[8px] font-black text-foreground/60 uppercase tracking-widest bg-background/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                    {media.progress}% Terminé
                  </div>
                </div>
              </div>
              
              <div className="mt-3 px-2">
                <div className="text-[10px] font-black text-foreground uppercase truncate">
                  {media.title}
                </div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5 tracking-widest italic">
                  Continuer la lecture
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResumeSection;
