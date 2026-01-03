import { useState, useEffect } from 'react';
import { Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HeroItem } from '@/types/media';

interface HeroSectionProps {
  heroItems: HeroItem[];
  onPlay: (mediaId: string) => void;
  onInfo: (mediaId: string) => void;
}

// Truncate description to max 2-3 lines (roughly 150 chars)
const truncateDescription = (text: string, maxLength: number = 150): string => {
  if (!text || text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
};

const HeroSection = ({ heroItems, onPlay, onInfo }: HeroSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (heroItems.length <= 1) return;
    
    // Use custom duration for current slide, or default 30 seconds
    const currentDuration = (heroItems[currentIndex]?.duration || 30) * 1000;
    
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % heroItems.length);
    }, currentDuration);
    
    return () => clearTimeout(timer);
  }, [heroItems, currentIndex]);

  if (heroItems.length === 0) return null;

  const currentItem = heroItems[currentIndex];

  return (
    <div className="relative h-[320px] md:h-[400px] lg:h-[450px] rounded-[32px] bg-card border border-border/30 overflow-hidden mb-10 shadow-card transition-all duration-700">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${currentItem.image})` }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      
      {/* Content */}
      <div 
        key={currentIndex}
        className="relative z-10 h-full flex flex-col justify-end px-6 md:px-10 pb-8 max-w-xl animate-fade-in"
      >
        <div className="bg-primary w-fit px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-3 text-primary-foreground glow-primary flex items-center gap-1.5">
          <span className="w-1 h-1 bg-primary-foreground rounded-full animate-pulse" />
          RECOMMANDÉ
        </div>
        
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black italic uppercase text-foreground mb-3 leading-none tracking-tight line-clamp-2">
          {currentItem.title}
        </h2>
        
        <p className="text-muted-foreground text-xs md:text-sm mb-5 italic max-w-md leading-relaxed line-clamp-3">
          {truncateDescription(currentItem.description, 180)}
        </p>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={() => onPlay(currentItem.mediaId)}
            className="bg-foreground text-background hover:bg-foreground/90 px-6 md:px-8 py-4 md:py-5 rounded-xl font-black text-xs uppercase tracking-wider gap-2 hover:scale-105 transition-transform"
          >
            <Play size={16} fill="currentColor" />
            Lecture
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => onInfo(currentItem.mediaId)}
            className="bg-secondary/30 backdrop-blur-sm border-border/30 hover:bg-secondary/50 px-5 py-4 md:py-5 rounded-xl font-semibold text-xs gap-2"
          >
            <Info size={16} />
            Plus d'infos
          </Button>
          
          {/* Indicators */}
          {heroItems.length > 1 && (
            <div className="flex gap-1.5 items-center ml-auto md:ml-4">
              {heroItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    currentIndex === i 
                      ? 'w-6 bg-primary glow-primary' 
                      : 'w-3 bg-foreground/20 hover:bg-foreground/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
