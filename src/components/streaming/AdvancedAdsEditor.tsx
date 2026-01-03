import { useState, useRef, useCallback } from 'react';
import { Upload, X, Plus, ArrowUp, ArrowDown, Link2, Image as ImageIcon, Code, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAdSettings } from '@/hooks/useAdSettings';
import type { SlideImage, SideAdSettings } from '@/types/ads';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

interface SideAdEditorProps {
  side: 'left' | 'right';
  sideSettings: SideAdSettings;
  onUpdate: (updates: Partial<SideAdSettings>) => void;
}

const SideAdEditor = ({ side, sideSettings, onUpdate }: SideAdEditorProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const label = side === 'left' ? 'Gauche' : 'Droite';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImages = sideSettings.slideAd.images;
    if (currentImages.length >= 3) {
      toast.error('Maximum 3 images par slide');
      return;
    }

    try {
      const newImages: SlideImage[] = [];
      for (let i = 0; i < Math.min(files.length, 3 - currentImages.length); i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const base64 = await fileToBase64(file);
          newImages.push({
            id: generateId(),
            imageUrl: base64,
            linkUrl: '',
          });
        }
      }

      if (newImages.length > 0) {
        onUpdate({
          slideAd: {
            ...sideSettings.slideAd,
            images: [...currentImages, ...newImages],
          },
        });
        toast.success(`${newImages.length} image(s) ajoutée(s)`);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSlideImage = (id: string) => {
    onUpdate({
      slideAd: {
        ...sideSettings.slideAd,
        images: sideSettings.slideAd.images.filter(img => img.id !== id),
      },
    });
  };

  const updateSlideImage = (id: string, updates: Partial<SlideImage>) => {
    onUpdate({
      slideAd: {
        ...sideSettings.slideAd,
        images: sideSettings.slideAd.images.map(img =>
          img.id === id ? { ...img, ...updates } : img
        ),
      },
    });
  };

  const moveSlideImage = (id: string, direction: 'up' | 'down') => {
    const images = [...sideSettings.slideAd.images];
    const index = images.findIndex(img => img.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    [images[index], images[newIndex]] = [images[newIndex], images[index]];
    onUpdate({
      slideAd: {
        ...sideSettings.slideAd,
        images,
      },
    });
  };

  const handleStaticFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await fileToBase64(file);
        onUpdate({
          staticAd: {
            ...sideSettings.staticAd,
            imageUrl: base64,
          },
        });
        toast.success('Image ajoutée');
      } catch {
        toast.error('Erreur lors du chargement');
      }
    }
  };

  return (
    <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-6">
      <h3 className="font-semibold text-foreground text-lg">Publicité {label}</h3>

      {/* Slide Ad Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-foreground">Pub en slide</h4>
            <p className="text-sm text-muted-foreground">Jusqu'à 3 images en rotation</p>
          </div>
          <Switch
            checked={sideSettings.slideAd.enabled}
            onCheckedChange={(checked) => onUpdate({
              slideAd: { ...sideSettings.slideAd, enabled: checked }
            })}
          />
        </div>

        {sideSettings.slideAd.enabled && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            {/* Images list */}
            <div className="space-y-3">
              {sideSettings.slideAd.images.map((img, index) => (
                <div
                  key={img.id}
                  className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg border border-border/30"
                >
                  <img
                    src={img.imageUrl}
                    alt={`Slide ${index + 1}`}
                    className="w-20 h-16 object-cover rounded"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Image {index + 1}
                      </span>
                      <div className="flex gap-1 ml-auto">
                        <button
                          onClick={() => moveSlideImage(img.id, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-muted rounded disabled:opacity-30"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => moveSlideImage(img.id, 'down')}
                          disabled={index === sideSettings.slideAd.images.length - 1}
                          className="p-1 hover:bg-muted rounded disabled:opacity-30"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => removeSlideImage(img.id)}
                          className="p-1 hover:bg-destructive/20 text-destructive rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <Input
                      value={img.linkUrl}
                      onChange={(e) => updateSlideImage(img.id, { linkUrl: e.target.value })}
                      placeholder="URL de redirection"
                      className="bg-background/50 text-sm h-8"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Add image button */}
            {sideSettings.slideAd.images.length < 3 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-dashed"
                >
                  <Plus size={16} className="mr-2" />
                  Ajouter une image ({sideSettings.slideAd.images.length}/3)
                </Button>
              </div>
            )}

            {/* Interval setting */}
            <div className="flex items-center gap-4">
              <Label className="text-sm text-foreground whitespace-nowrap">
                Intervalle (sec):
              </Label>
              <Input
                type="number"
                min={3}
                max={120}
                value={sideSettings.slideAd.interval}
                onChange={(e) => onUpdate({
                  slideAd: {
                    ...sideSettings.slideAd,
                    interval: Math.max(3, Math.min(120, parseInt(e.target.value) || 30)),
                  },
                })}
                className="w-20 bg-muted/50"
              />
              <span className="text-xs text-muted-foreground">
                (Sera synchronisé avec le Hero si activé)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Static Ad Section */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-foreground">Pub statique</h4>
            <p className="text-sm text-muted-foreground">Image fixe ou AdSense</p>
          </div>
          <Switch
            checked={sideSettings.staticAd.enabled}
            onCheckedChange={(checked) => onUpdate({
              staticAd: { ...sideSettings.staticAd, enabled: checked }
            })}
          />
        </div>

        {sideSettings.staticAd.enabled && (
          <div className="space-y-4 pt-4">
            {/* Type selector */}
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate({
                  staticAd: { ...sideSettings.staticAd, type: 'image' }
                })}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 transition-all ${
                  sideSettings.staticAd.type === 'image'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                <ImageIcon size={16} />
                Image
              </button>
              <button
                onClick={() => onUpdate({
                  staticAd: { ...sideSettings.staticAd, type: 'adsense' }
                })}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 transition-all ${
                  sideSettings.staticAd.type === 'adsense'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                <Code size={16} />
                AdSense
              </button>
            </div>

            {sideSettings.staticAd.type === 'image' ? (
              <div className="space-y-3">
                {/* Image preview/upload */}
                <div className="space-y-2">
                  <Label>Image</Label>
                  {sideSettings.staticAd.imageUrl ? (
                    <div className="relative">
                      <img
                        src={sideSettings.staticAd.imageUrl}
                        alt="Static ad"
                        className="w-full max-h-32 object-contain rounded-lg bg-muted/30"
                      />
                      <button
                        onClick={() => onUpdate({
                          staticAd: { ...sideSettings.staticAd, imageUrl: '' }
                        })}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`static-file-${side}`}
                        onChange={handleStaticFileSelect}
                      />
                      <label
                        htmlFor={`static-file-${side}`}
                        className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-muted-foreground transition-colors"
                      >
                        <Upload size={24} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Cliquez pour uploader
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* URL input */}
                <div className="space-y-2">
                  <Label>Ou URL de l'image</Label>
                  <Input
                    value={sideSettings.staticAd.imageUrl.startsWith('data:') ? '' : sideSettings.staticAd.imageUrl}
                    onChange={(e) => onUpdate({
                      staticAd: { ...sideSettings.staticAd, imageUrl: e.target.value }
                    })}
                    placeholder="https://example.com/image.png"
                    className="bg-muted/50"
                  />
                </div>

                {/* Link URL */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Link2 size={14} />
                    URL de redirection
                  </Label>
                  <Input
                    value={sideSettings.staticAd.linkUrl}
                    onChange={(e) => onUpdate({
                      staticAd: { ...sideSettings.staticAd, linkUrl: e.target.value }
                    })}
                    placeholder="https://example.com"
                    className="bg-muted/50"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Code Google AdSense</Label>
                <textarea
                  value={sideSettings.staticAd.adsenseCode}
                  onChange={(e) => onUpdate({
                    staticAd: { ...sideSettings.staticAd, adsenseCode: e.target.value }
                  })}
                  placeholder={'<script async src="..."></script>\n<ins class="adsbygoogle"...></ins>'}
                  className="w-full h-32 bg-muted/50 border border-border rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AdvancedAdsEditor = () => {
  const { settings, saving, updateSideSettings, toggleHeroSync } = useAdSettings();

  const handleUpdateLeft = useCallback((updates: Partial<SideAdSettings>) => {
    updateSideSettings('left', updates);
  }, [updateSideSettings]);

  const handleUpdateRight = useCallback((updates: Partial<SideAdSettings>) => {
    updateSideSettings('right', updates);
  }, [updateSideSettings]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Publicités</h2>
        <p className="text-muted-foreground text-sm">
          Configurez les publicités affichées sur les côtés du site.
        </p>
      </div>

      {/* Explanation */}
      <div className="bg-muted/30 border border-border/30 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Comment ça marche ?</p>
        <ul className="space-y-1.5">
          <li><strong>Pubs en slide</strong> : Jusqu'à 3 images en rotation automatique</li>
          <li><strong>Pubs statiques</strong> : Image fixe ou code AdSense</li>
          <li>Vous pouvez activer les deux sur chaque côté</li>
        </ul>
      </div>

      {/* Hero Sync Toggle */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-foreground">Synchroniser avec le Hero</h4>
            <p className="text-sm text-muted-foreground">
              Les pubs slides changeront en même temps que le Hero slider
            </p>
          </div>
          <Switch
            checked={settings.heroSyncEnabled}
            onCheckedChange={toggleHeroSync}
          />
        </div>
      </div>

      {/* Left Side Editor */}
      <SideAdEditor
        side="left"
        sideSettings={settings.left}
        onUpdate={handleUpdateLeft}
      />

      {/* Right Side Editor */}
      <SideAdEditor
        side="right"
        sideSettings={settings.right}
        onUpdate={handleUpdateRight}
      />

      {/* Save indicator */}
      {saving && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Sauvegarde en cours...</span>
        </div>
      )}
    </div>
  );
};

export default AdvancedAdsEditor;
