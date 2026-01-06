import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bookmark, Heart } from 'lucide-react';
import { Search, LayoutGrid, Film, Tv, Settings, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import NotificationBell from './NotificationBell';
import type { Media } from '@/types/media';

type ViewType = 'home' | 'films' | 'series' | 'watchlist' | 'favorites' | 'detail' | 'player' | 'settings';

interface HeaderProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  isAdmin: boolean;
  onAdminClick: () => void;
  onLogout: () => void;
  library: Media[];
  onSelectMedia: (media: Media) => void;
}

const Header = ({ 
  view, 
  setView, 
  isAdmin, 
  onAdminClick, 
  onLogout,
  library,
  onSelectMedia 
}: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Map view to route path
  const viewToPath: Record<ViewType, string> = {
    home: '/',
    films: '/films',
    series: '/series',
    watchlist: '/watchlist',
    favorites: '/favorites',
    settings: '/settings',
    detail: '/detail',
    player: '/player',
  };

  // Get current view from pathname
  const getCurrentView = (): ViewType => {
    const pathToView: Record<string, ViewType> = {
      '/': 'home',
      '/films': 'films',
      '/series': 'series',
      '/watchlist': 'watchlist',
      '/favorites': 'favorites',
      '/settings': 'settings',
      '/detail': 'detail',
      '/player': 'player',
    };
    return pathToView[location.pathname] || 'home';
  };

  const currentView = getCurrentView();

  const handleNavClick = (navView: ViewType) => {
    navigate(viewToPath[navView]);
    setView(navView);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim()
    ? library.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const navItems = [
    { id: 'home' as const, label: 'Accueil', icon: LayoutGrid },
    { id: 'films' as const, label: 'Films', icon: Film },
    { id: 'series' as const, label: 'Séries', icon: Tv },
    { id: 'watchlist' as const, label: 'Watchlist', icon: Bookmark },
    { id: 'favorites' as const, label: '', icon: Heart, iconOnly: true },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 md:px-8 py-3 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={() => handleNavClick('home')}
        >
          <img 
            src={logo} 
            alt="Global Classic TV" 
            className="w-10 h-10 md:w-12 md:h-12 object-contain group-hover:scale-105 transition-transform"
          />
          <div className="min-w-0">
            <h1 className="font-display text-lg md:text-xl font-bold tracking-tight text-foreground leading-none whitespace-nowrap">
              <span className="hidden xl:inline">GLOBAL CLASSIC TV</span>
              <span className="hidden lg:inline xl:hidden">GC TV</span>
              <span className="inline lg:hidden">GCTV</span>
            </h1>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest hidden xl:block">
              Streaming Premium
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(({ id, label, icon: Icon, iconOnly }) => (
            <Button
              key={id}
              variant="ghost"
              onClick={() => handleNavClick(id)}
              className={`${iconOnly ? 'px-2' : 'px-4'} py-2 rounded-xl font-semibold text-sm gap-2 transition-all ${
                currentView === id 
                  ? id === 'favorites' ? 'text-red-500 bg-red-500/10' : 'text-primary bg-primary/10'
                  : id === 'favorites' ? 'text-red-500 hover:bg-red-500/10' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={18} className={id === 'favorites' ? (currentView === id ? 'fill-red-500' : '') : ''} />
              {label}
            </Button>
          ))}
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                className="w-32 md:w-64 bg-secondary/50 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-primary/50 focus:bg-secondary/80 transition-all text-sm text-foreground placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border/50 shadow-card overflow-hidden z-50 bg-card animate-scale-in">
                {searchResults.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {searchResults.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectMedia(item);
                          setSearchQuery('');
                          setIsSearchOpen(false);
                        }}
                        className="flex gap-3 p-2 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors group"
                      >
                        <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                            {item.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Aucun résultat pour "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Admin Button */}
          {isAdmin ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              <LogOut size={18} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAdminClick}
              className="rounded-xl text-muted-foreground hover:text-foreground"
            >
              <Settings size={18} />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="flex lg:hidden items-center justify-center gap-2 mt-3 flex-wrap">
        {navItems.map(({ id, label, icon: Icon, iconOnly }) => (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            onClick={() => handleNavClick(id)}
            className={`${iconOnly ? 'px-2' : 'px-3'} py-1.5 rounded-lg font-semibold text-xs gap-1.5 ${
              currentView === id 
                ? id === 'favorites' ? 'text-red-500 bg-red-500/10' : 'text-primary bg-primary/10'
                : id === 'favorites' ? 'text-red-500' : 'text-muted-foreground'
            }`}
          >
            <Icon size={14} className={id === 'favorites' ? (currentView === id ? 'fill-red-500' : '') : ''} />
            {label}
          </Button>
        ))}
      </nav>
    </header>
  );
};

export default Header;
