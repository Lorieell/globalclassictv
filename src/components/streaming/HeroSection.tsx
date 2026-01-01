import { useState, useEffect } from 'react';
import { Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HeroItem, Media } from '@/types/media';

interface HeroSectionProps {
  heroItems: HeroItem[];
  onPlay: (mediaId: string) => void;
}

const HeroSection = ({ heroItems, onPlay }: HeroSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroItems.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroItems.length]);

  if (heroItems.length === 0) return null;

  const currentItem = heroItems[currentIndex];

  return (
    <div className="relative h-[500px] md:h-[550px] rounded-3xl md:rounded-4xl overflow-hidden mb-12 shadow-card group">
      {/* Background Image with Ken Burns effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${currentItem.image})` }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12 max-w-2xl animate-slide-in-left">
        <div className="inline-flex items-center gap-2 bg-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 w-fit glow-primary">
          <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
          Recommandé
        </div>
        
        <h2 className="font-display text-5xl md:text-7xl font-bold uppercase text-foreground mb-4 leading-none tracking-tight">
          {currentItem.title}
        </h2>
        
        <p className="text-muted-foreground text-sm md:text-base mb-8 leading-relaxed max-w-lg">
          {currentItem.description}
        </p>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => onPlay(currentItem.mediaId)}
            className="bg-foreground text-background hover:bg-foreground/90 px-8 py-6 rounded-2xl font-bold text-sm uppercase tracking-wider gap-3 glow-primary"
          >
            <Play size={20} fill="currentColor" />
            Lecture
          </Button>
          
          <Button 
            variant="outline"
            className="bg-secondary/50 backdrop-blur-sm border-border/50 hover:bg-secondary px-6 py-6 rounded-2xl font-semibold text-sm gap-2"
          >
            <Info size={18} />
            Plus d'infos
          </Button>
        </div>
      </div>
      
      {/* Indicators */}
      <div className="absolute bottom-8 right-8 flex gap-2 z-10">
        {heroItems.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              currentIndex === i 
                ? 'w-10 bg-primary glow-primary' 
                : 'w-6 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
