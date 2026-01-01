import { useState, useEffect } from 'react';
import { Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HeroItem } from '@/types/media';

interface HeroSectionProps {
  heroItems: HeroItem[];
  onPlay: (mediaId: string) => void;
  onInfo: (mediaId: string) => void;
}

const HeroSection = ({ heroItems, onPlay, onInfo }: HeroSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroItems.length]);

  if (heroItems.length === 0) return null;

  const currentItem = heroItems[currentIndex];

  return (
    <div className="relative h-[450px] md:h-[500px] rounded-[40px] bg-card border border-border/30 overflow-hidden mb-16 shadow-card transition-all duration-700">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${currentItem.image})` }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      
      {/* Content */}
      <div 
        key={currentIndex}
        className="relative z-10 h-full flex flex-col justify-center px-8 md:px-12 max-w-2xl animate-slide-in-left"
      >
        <div className="bg-primary w-fit px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-6 text-primary-foreground glow-primary flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-pulse" />
          RECOMMANDÉ
        </div>
        
        <h2 className="font-display text-5xl md:text-7xl font-black italic uppercase text-foreground mb-6 leading-none tracking-tighter">
          {currentItem.title}
        </h2>
        
        <p className="text-muted-foreground text-sm md:text-base mb-8 italic max-w-lg leading-relaxed">
          {currentItem.description}
        </p>
        
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            onClick={() => onPlay(currentItem.mediaId)}
            className="bg-foreground text-background hover:bg-foreground/90 px-8 md:px-10 py-5 md:py-6 rounded-2xl font-black text-xs uppercase tracking-wider gap-2 hover:scale-105 transition-transform"
          >
            <Play size={18} fill="currentColor" />
            Lecture
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => onInfo(currentItem.mediaId)}
            className="bg-secondary/30 backdrop-blur-sm border-border/30 hover:bg-secondary/50 px-6 py-5 md:py-6 rounded-2xl font-semibold text-sm gap-2"
          >
            <Info size={18} />
            Plus d'infos
          </Button>
          
          {/* Indicators */}
          <div className="flex gap-2 items-center ml-auto md:ml-4">
            {heroItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  currentIndex === i 
                    ? 'w-8 bg-primary glow-primary' 
                    : 'w-4 bg-foreground/20 hover:bg-foreground/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
