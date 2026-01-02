import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Save, Trash2, Upload, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Media, Season, Episode } from '@/types/media';

interface MediaEditorModalProps {
  isOpen: boolean;
  media: Partial<Media> | null;
  onClose: () => void;
  onSave: (media: Media) => void;
}

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

const MediaEditorModal = ({ isOpen, media, onClose, onSave }: MediaEditorModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Media>>({
    title: '',
    image: '',
    type: 'Film',
    description: '',
    synopsis: '',
    genres: '',
    quality: '',
    language: '',
    videoUrls: '',
    seasons: [],
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkSeasonIndex, setBulkSeasonIndex] = useState<number>(0);
  const [bulkCount, setBulkCount] = useState<number>(10);

  useEffect(() => {
    if (media) {
      setFormData({
        ...media,
        synopsis: media.synopsis || '',
        genres: media.genres || '',
        quality: media.quality || '',
        language: media.language || '',
        seasons: media.seasons || [],
      });
    }
  }, [media]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, image: base64 }));
        toast({ title: "Image ajoutée", description: "L'image a été chargée avec succès" });
      } catch {
        toast({ title: "Erreur", description: "Impossible de charger l'image", variant: "destructive" });
      }
    }
  }, [toast]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, image: base64 }));
        toast({ title: "Image ajoutée", description: "L'image a été chargée avec succès" });
      } catch {
        toast({ title: "Erreur", description: "Impossible de charger l'image", variant: "destructive" });
      }
    }
  }, [toast]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.title || !formData.image) {
      toast({
        title: "Champs requis",
        description: "Titre et image sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    onSave({
      id: formData.id || crypto.randomUUID(),
      title: formData.title,
      image: formData.image,
      type: formData.type as 'Film' | 'Série',
      description: formData.description || '',
      synopsis: formData.synopsis,
      genres: formData.genres,
      quality: formData.quality,
      language: formData.language,
      videoUrls: formData.videoUrls,
      seasons: formData.seasons,
      isManual: true, // Mark as manually added
    });

    toast({
      title: "Média enregistré",
      description: "Les modifications ont été sauvegardées",
    });
    onClose();
  };

  const addSeason = () => {
    const newSeason: Season = {
      id: crypto.randomUUID(),
      number: (formData.seasons?.length || 0) + 1,
      episodes: [],
    };
    setFormData({ ...formData, seasons: [...(formData.seasons || []), newSeason] });
  };

  const addEpisode = (seasonIndex: number) => {
    const seasons = [...(formData.seasons || [])];
    const newEpisode: Episode = {
      id: crypto.randomUUID(),
      number: (seasons[seasonIndex].episodes?.length || 0) + 1,
      title: 'Nouvel épisode',
      videoUrls: '',
    };
    seasons[seasonIndex].episodes = [...(seasons[seasonIndex].episodes || []), newEpisode];
    setFormData({ ...formData, seasons });
  };

  const addMultipleEpisodes = (seasonIndex: number, count: number) => {
    const seasons = [...(formData.seasons || [])];
    const currentCount = seasons[seasonIndex].episodes?.length || 0;
    const newEpisodes: Episode[] = Array.from({ length: count }, (_, i) => ({
      id: crypto.randomUUID(),
      number: currentCount + i + 1,
      title: `Épisode ${currentCount + i + 1}`,
      videoUrls: '',
    }));
    seasons[seasonIndex].episodes = [...(seasons[seasonIndex].episodes || []), ...newEpisodes];
    setFormData({ ...formData, seasons });
    toast({ title: `${count} épisodes ajoutés`, description: `Saison ${seasons[seasonIndex].number}` });
  };

  const openBulkAdd = (seasonIndex: number) => {
    setBulkSeasonIndex(seasonIndex);
    setBulkCount(10);
    setBulkAddOpen(true);
  };

  const updateEpisode = (seasonIndex: number, episodeIndex: number, field: keyof Episode, value: string | number) => {
    const seasons = [...(formData.seasons || [])];
    seasons[seasonIndex].episodes[episodeIndex] = {
      ...seasons[seasonIndex].episodes[episodeIndex],
      [field]: value,
    };
    setFormData({ ...formData, seasons });
  };

  const removeEpisode = (seasonIndex: number, episodeIndex: number) => {
    const seasons = [...(formData.seasons || [])];
    seasons[seasonIndex].episodes = seasons[seasonIndex].episodes.filter((_, i) => i !== episodeIndex);
    setFormData({ ...formData, seasons });
  };

  const removeSeason = (seasonIndex: number) => {
    const seasons = (formData.seasons || []).filter((_, i) => i !== seasonIndex);
    setFormData({ ...formData, seasons });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl p-6 md:p-8 border border-border/50 shadow-card animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl font-bold text-foreground">
            {formData.id ? 'Modifier le média' : 'Nouveau média'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Titre</label>
              <input
                type="text"
                placeholder="Titre du média"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">URL de l'image</label>
              <input
                type="text"
                placeholder="https://... ou glissez une image ci-dessous"
                value={formData.image?.startsWith('data:') ? '' : formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Film' | 'Série' })}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-foreground"
              >
                <option value="Film">Film</option>
                <option value="Série">Série</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Description courte</label>
              <textarea
                placeholder="Description courte..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 h-20 resize-none text-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Synopsis complet</label>
              <textarea
                placeholder="Synopsis détaillé..."
                value={formData.synopsis || ''}
                onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 h-28 resize-none text-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Genres (séparés par virgules)</label>
              <input
                type="text"
                placeholder="Action, Drame, Science-Fiction..."
                value={formData.genres || ''}
                onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Qualité</label>
                <input
                  type="text"
                  placeholder="HD, FHD, 4K..."
                  value={formData.quality || ''}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                  className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Langue</label>
                <input
                  type="text"
                  placeholder="VF, VOSTFR..."
                  value={formData.language || ''}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-foreground"
                />
              </div>
            </div>

            {/* Always show video URLs for Film content */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Liens vidéo Film (séparés par des virgules)
              </label>
              <textarea
                placeholder="https://player1.com, https://player2.com"
                value={formData.videoUrls || ''}
                onChange={(e) => setFormData({ ...formData, videoUrls: e.target.value })}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 h-20 resize-none text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.type === 'Série' 
                  ? "Optionnel : ajoutez un film en plus des saisons" 
                  : "URLs des lecteurs vidéo pour ce film"}
              </p>
            </div>
          </div>

          {/* Image Preview with Drag & Drop */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-secondary/30 overflow-hidden min-h-[300px] cursor-pointer transition-all ${
              isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-border/50 hover:border-muted-foreground'
            }`}
          >
            {formData.image ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img src={formData.image} alt="Preview" className="max-h-64 object-contain rounded-lg" />
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <p className="text-xs text-muted-foreground bg-background/80 inline-block px-3 py-1 rounded-full">
                    Cliquez ou glissez pour remplacer
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3">
                <Upload className="mx-auto text-muted-foreground" size={48} />
                <div>
                  <p className="text-muted-foreground font-medium">Glissez une image ici</p>
                  <p className="text-xs text-muted-foreground mt-1">ou cliquez pour parcourir</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Seasons & Episodes (always available to add seasons to any media) */}
        {(formData.type === 'Série' || (formData.seasons && formData.seasons.length > 0)) && (
          <div className="pt-6 border-t border-border/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-xl font-bold text-foreground">Saisons & Épisodes</h3>
              <Button onClick={addSeason} size="sm" className="bg-accent text-accent-foreground gap-2">
                <Plus size={16} /> Ajouter une saison
              </Button>
            </div>

            <div className="space-y-4">
              {formData.seasons?.map((season, sIdx) => (
                <div key={season.id} className="bg-secondary/30 rounded-2xl p-4 border border-border/30">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-foreground">Saison {season.number}</h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addEpisode(sIdx)}
                        className="text-xs gap-1"
                      >
                        <Plus size={14} /> Épisode
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openBulkAdd(sIdx)}
                        className="text-xs gap-1 bg-accent/20 border-accent/50 text-accent-foreground hover:bg-accent/30"
                      >
                        <ListPlus size={14} /> Ajouter plusieurs
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSeason(sIdx)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {season.episodes?.map((ep, eIdx) => (
                      <div key={ep.id} className="bg-background/50 p-3 rounded-xl flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            value={ep.number}
                            onChange={(e) => updateEpisode(sIdx, eIdx, 'number', parseInt(e.target.value))}
                            className="w-14 bg-secondary/50 border border-border/50 rounded-lg p-2 text-center text-sm text-foreground"
                          />
                          <input
                            type="text"
                            value={ep.title}
                            onChange={(e) => updateEpisode(sIdx, eIdx, 'title', e.target.value)}
                            placeholder="Titre de l'épisode"
                            className="flex-1 bg-secondary/50 border border-border/50 rounded-lg p-2 text-sm text-foreground"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeEpisode(sIdx, eIdx)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                        <input
                          type="text"
                          value={ep.videoUrls}
                          onChange={(e) => updateEpisode(sIdx, eIdx, 'videoUrls', e.target.value)}
                          placeholder="Liens vidéo (séparés par virgules)"
                          className="w-full bg-secondary/50 border border-border/50 rounded-lg p-2 text-xs text-foreground"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

      {/* Bulk Add Episodes Dialog */}
      <Dialog open={bulkAddOpen} onOpenChange={setBulkAddOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Ajouter plusieurs épisodes</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Nombre d'épisodes à ajouter
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={bulkCount}
              onChange={(e) => setBulkCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-foreground text-center text-lg font-bold"
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Les épisodes seront numérotés automatiquement
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkAddOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                addMultipleEpisodes(bulkSeasonIndex, bulkCount);
                setBulkAddOpen(false);
              }}
              className="bg-primary text-primary-foreground gap-2"
            >
              <ListPlus size={16} /> Ajouter {bulkCount} épisodes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaEditorModal;
