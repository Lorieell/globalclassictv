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

  // CRITICAL: Always use the image provided in heroItem (should be backdrop)
  // If no image, this is a problem - the hero generator should always provide backdrop
  const heroImage = currentItem.image;
  
  return (
    <div className="relative h-[220px] sm:h-[280px] md:h-[380px] lg:h-[450px] rounded-xl sm:rounded-2xl md:rounded-[32px] bg-card border border-border/30 overflow-hidden mb-4 sm:mb-6 md:mb-10 shadow-card transition-all duration-700">
      {/* Background Image - MUST be horizontal backdrop */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      
      {/* Content */}
      <div 
        key={currentIndex}
        className="relative z-10 h-full flex flex-col justify-end px-3 sm:px-6 md:px-10 pb-4 sm:pb-6 md:pb-8 max-w-xl animate-fade-in"
      >
        <div className="bg-primary w-fit px-2 py-0.5 rounded-full text-[6px] sm:text-[7px] md:text-[8px] font-black uppercase tracking-widest mb-1.5 sm:mb-2 md:mb-3 text-primary-foreground glow-primary flex items-center gap-1">
          <span className="w-1 h-1 bg-primary-foreground rounded-full animate-pulse" />
          RECOMMANDÉ
        </div>
        
        <h2 className="font-display text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black italic uppercase text-foreground mb-1.5 sm:mb-2 md:mb-3 leading-none tracking-tight line-clamp-2">
          {currentItem.title}
        </h2>
        
        <p className="text-muted-foreground text-[9px] sm:text-[10px] md:text-xs mb-3 sm:mb-4 md:mb-5 italic max-w-md leading-relaxed line-clamp-2 hidden sm:block">
          {truncateDescription(currentItem.description, 150)}
        </p>
        
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3">
          <Button 
            onClick={() => onPlay(currentItem.mediaId)}
            className="bg-foreground text-background hover:bg-foreground/90 px-3 sm:px-5 md:px-8 py-2 sm:py-3 md:py-5 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider gap-1 sm:gap-2 hover:scale-105 transition-transform"
          >
            <Play size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" fill="currentColor" />
            <span className="hidden xs:inline">Lecture</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => onInfo(currentItem.mediaId)}
            className="bg-secondary/30 backdrop-blur-sm border-border/30 hover:bg-secondary/50 px-2.5 sm:px-4 md:px-5 py-2 sm:py-3 md:py-5 rounded-lg sm:rounded-xl font-semibold text-[9px] sm:text-[10px] md:text-xs gap-1 sm:gap-2"
          >
            <Info size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Plus d'infos</span>
          </Button>
          
          {/* Indicators */}
          {heroItems.length > 1 && (
            <div className="flex gap-1 items-center ml-auto md:ml-4">
              {heroItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    currentIndex === i 
                      ? 'w-4 sm:w-6 bg-primary glow-primary' 
                      : 'w-1.5 sm:w-2 md:w-3 bg-foreground/20 hover:bg-foreground/40'
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
