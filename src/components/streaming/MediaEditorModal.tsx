import { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Media, Season, Episode } from '@/types/media';

interface MediaEditorModalProps {
  isOpen: boolean;
  media: Partial<Media> | null;
  onClose: () => void;
  onSave: (media: Media) => void;
}

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
                placeholder="https://..."
                value={formData.image}
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

            {formData.type === 'Film' && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Liens vidéo (séparés par des virgules)
                </label>
                <textarea
                  placeholder="https://player1.com, https://player2.com"
                  value={formData.videoUrls || ''}
                  onChange={(e) => setFormData({ ...formData, videoUrls: e.target.value })}
                  className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 h-20 resize-none text-foreground"
                />
              </div>
            )}
          </div>

          {/* Image Preview */}
          <div className="flex items-center justify-center border-2 border-dashed border-border/50 rounded-2xl bg-secondary/30 overflow-hidden min-h-[200px]">
            {formData.image ? (
              <img src={formData.image} alt="Preview" className="max-h-64 object-contain" />
            ) : (
              <p className="text-muted-foreground text-sm">Aperçu de l'image</p>
            )}
          </div>
        </div>

        {/* Seasons & Episodes (for Series) */}
        {formData.type === 'Série' && (
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
    </div>
  );
};

export default MediaEditorModal;
