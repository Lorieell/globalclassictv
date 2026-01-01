import { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2, Image, Type, FileText, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { HeroItem } from '@/types/media';

interface HeroEditorModalProps {
  isOpen: boolean;
  heroItems: HeroItem[];
  mediaOptions: { id: string; title: string }[];
  onClose: () => void;
  onSave: (items: HeroItem[]) => void;
}

const HeroEditorModal = ({ isOpen, heroItems, mediaOptions, onClose, onSave }: HeroEditorModalProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<HeroItem[]>([]);

  useEffect(() => {
    setItems(heroItems);
  }, [heroItems]);

  if (!isOpen) return null;

  const addItem = () => {
    const newItem: HeroItem = {
      id: crypto.randomUUID(),
      title: 'Nouveau Slide',
      description: 'Description du slide...',
      image: '',
      mediaId: mediaOptions[0]?.id || '',
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof HeroItem, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
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

        <p className="text-muted-foreground text-sm mb-6">
          Configurez les slides qui apparaissent en haut de la page d'accueil. Chaque slide peut être lié à un média du catalogue.
        </p>

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
                      <Link size={12} /> Média associé
                    </label>
                    <select
                      value={item.mediaId}
                      onChange={(e) => updateItem(item.id, 'mediaId', e.target.value)}
                      className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 text-sm text-foreground"
                    >
                      <option value="">-- Sélectionner --</option>
                      {mediaOptions.map(media => (
                        <option key={media.id} value={media.id}>
                          {media.title}
                        </option>
                      ))}
                    </select>
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
