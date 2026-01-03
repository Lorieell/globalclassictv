import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Save, Trash2, Image, Type, FileText, Wand2, Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { HeroItem, Media } from '@/types/media';

interface HeroEditorModalProps {
  isOpen: boolean;
  heroItems: HeroItem[];
  mediaOptions: Media[];
  onClose: () => void;
  onSave: (items: HeroItem[]) => void;
}

// Parse duration input like "30s", "5m", "1h", "2j", "1sem" to seconds
const parseDurationInput = (input: string): number | null => {
  const trimmed = input.trim().toLowerCase();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(s|sec|m|min|h|j|d|sem|semaine)?$/);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 's';
  
  switch (unit) {
    case 's':
    case 'sec':
      return Math.max(5, Math.round(value));
    case 'm':
    case 'min':
      return Math.max(5, Math.round(value * 60));
    case 'h':
      return Math.max(5, Math.round(value * 3600));
    case 'j':
    case 'd':
      return Math.max(5, Math.round(value * 86400));
    case 'sem':
    case 'semaine':
      return Math.max(5, Math.round(value * 604800));
    default:
      return Math.max(5, Math.round(value));
  }
};

// Format seconds to human-readable string
const formatDurationInput = (seconds: number): string => {
  if (seconds >= 604800 && seconds % 604800 === 0) {
    return `${seconds / 604800}sem`;
  } else if (seconds >= 86400 && seconds % 86400 === 0) {
    return `${seconds / 86400}j`;
  } else if (seconds >= 3600 && seconds % 3600 === 0) {
    return `${seconds / 3600}h`;
  } else if (seconds >= 60 && seconds % 60 === 0) {
    return `${seconds / 60}m`;
  }
  return `${seconds}s`;
};

const HeroEditorModal = ({ isOpen, heroItems, mediaOptions, onClose, onSave }: HeroEditorModalProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<HeroItem[]>([]);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  // Initialize items when modal opens or heroItems change
  useEffect(() => {
    if (isOpen) {
      // Always load the current hero items when modal opens
      console.log('HeroEditorModal opened with heroItems:', heroItems);
      // Deep clone to avoid mutating original
      const clonedItems = heroItems.map(item => ({
        ...item,
        duration: item.duration || 30,
      }));
      setItems(clonedItems.length > 0 ? clonedItems : []);
      setSearchQueries({});
    }
  }, [isOpen, heroItems]);

  if (!isOpen) return null;

  const addItem = () => {
    const newItem: HeroItem = {
      id: crypto.randomUUID(),
      title: 'Nouveau Slide',
      description: 'Description du slide...',
      image: '',
      mediaId: '',
      duration: 30,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof HeroItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { 
        ...item, 
        [field]: field === 'duration' ? Number(value) : value 
      } : item
    ));
  };

  // Auto-fill fields when media is selected
  const handleMediaSelect = (itemId: string, mediaId: string) => {
    const selectedMedia = mediaOptions.find(m => m.id === mediaId);
    if (selectedMedia) {
      setItems(items.map(item => 
        item.id === itemId ? {
          ...item,
          mediaId: mediaId,
          title: selectedMedia.title.toUpperCase(),
          description: selectedMedia.description || selectedMedia.synopsis || 'Aucune description disponible.',
          image: (selectedMedia as any).backdrop || selectedMedia.image || '',
        } : item
      ));
      // Clear search after selection
      setSearchQueries(prev => ({ ...prev, [itemId]: '' }));
      toast({
        title: "Champs remplis automatiquement",
        description: `Données de "${selectedMedia.title}" appliquées`,
      });
    } else {
      updateItem(itemId, 'mediaId', mediaId);
    }
  };

  const getFilteredMedia = (itemId: string) => {
    const query = searchQueries[itemId]?.toLowerCase() || '';
    if (!query) return mediaOptions.slice(0, 50); // Show first 50 if no search
    return mediaOptions.filter(m => 
      m.title.toLowerCase().includes(query)
    ).slice(0, 50);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSave = () => {
    onSave(items);
    toast({
      title: "Slides sauvegardés",
      description: `${items.length} slide(s) mis à jour`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl p-6 md:p-8 border border-border/50 shadow-card animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Gérer les Slides Recommandés
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-foreground">
            <Wand2 size={16} className="inline mr-2 text-primary" />
            <strong>Auto-rotation activée :</strong> Les slides changent automatiquement toutes les heures avec de nouveaux médias populaires.
            <br />
            <span className="text-muted-foreground text-xs mt-1 block">
              Sélectionnez un média pour remplir automatiquement les champs.
            </span>
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className="bg-secondary/30 rounded-2xl p-4 border border-border/30 animate-fade-in"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Slide {index + 1}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {/* Media Selection with Search */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Wand2 size={12} className="text-primary" /> Média associé <span className="text-primary">(auto-remplissage)</span>
                    </label>
                    
                    {/* Search Input */}
                    <div className="relative mb-2">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQueries[item.id] || ''}
                        onChange={(e) => setSearchQueries(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Rechercher un média..."
                        className="w-full bg-background/50 border border-border/50 rounded-lg pl-9 pr-4 py-2 outline-none focus:border-primary/50 text-sm text-foreground"
                      />
                    </div>
                    
                    {/* Media Select */}
                    <select
                      value={item.mediaId}
                      onChange={(e) => handleMediaSelect(item.id, e.target.value)}
                      className="w-full bg-background/50 border border-primary/30 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 text-sm text-foreground"
                    >
                      <option value="">-- Sélectionner un média --</option>
                      {getFilteredMedia(item.id).map(media => (
                        <option key={media.id} value={media.id}>
                          {media.title} ({media.type})
                        </option>
                      ))}
                    </select>
                    {searchQueries[item.id] && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {getFilteredMedia(item.id).length} résultat(s)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Type size={12} /> Titre
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                      placeholder="Titre du slide"
                      className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 text-sm text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <FileText size={12} /> Description
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Description..."
                      className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 text-sm resize-none h-20 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Image size={12} /> URL Image de fond
                    </label>
                    <input
                      type="text"
                      value={item.image}
                      onChange={(e) => updateItem(item.id, 'image', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 text-sm text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Clock size={12} /> Durée d'affichage
                    </label>
                    <input
                      type="text"
                      value={formatDurationInput(item.duration || 30)}
                      onChange={(e) => {
                        const seconds = parseDurationInput(e.target.value);
                        if (seconds !== null) {
                          updateItem(item.id, 'duration', seconds);
                        }
                      }}
                      placeholder="30s, 5m, 1h, 1j, 1sem"
                      className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 text-sm text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formats: 30s, 5m, 1h, 2j, 1sem
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center justify-center">
                  {item.image ? (
                    <div className="w-full aspect-video rounded-xl overflow-hidden border border-border/30 relative">
                      <img 
                        src={item.image} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent flex items-end p-4">
                        <div>
                          <p className="text-[8px] font-bold text-primary uppercase tracking-widest mb-1">
                            RECOMMANDÉ
                          </p>
                          <p className="font-display text-sm font-bold text-foreground uppercase">
                            {item.title || 'Titre'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-video rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center bg-secondary/20">
                      <p className="text-muted-foreground text-xs">Aperçu du slide</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={addItem}
          variant="outline"
          className="w-full rounded-xl border-dashed border-2 py-6 text-muted-foreground hover:text-foreground hover:border-primary/50 gap-2"
        >
          <Plus size={18} />
          Ajouter un slide
        </Button>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border/50">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Annuler
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground rounded-xl gap-2">
            <Save size={18} /> Sauvegarder
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroEditorModal;
