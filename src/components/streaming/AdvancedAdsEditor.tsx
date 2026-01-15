import { useState, useRef, useCallback } from 'react';
import { Upload, X, Plus, ArrowUp, ArrowDown, Link2, Image as ImageIcon, Code, Loader2, Save, Trash2, GripVertical, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAdSettings } from '@/hooks/useAdSettings';
import type { SlideImage, SlideAd, StaticAd, Ad } from '@/types/ads';
import { createSlideAd, createStaticAd, generateAdId } from '@/types/ads';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

interface SlideAdEditorProps {
  ad: SlideAd;
  onUpdate: (updates: Partial<SlideAd>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

const SlideAdEditor = ({ ad, onUpdate, onRemove, onMove, isFirst, isLast }: SlideAdEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (ad.images.length >= 3) {
      toast.error('Maximum 3 images par slide');
      return;
    }

    try {
      const newImages: SlideImage[] = [];
      for (let i = 0; i < Math.min(files.length, 3 - ad.images.length); i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const base64 = await fileToBase64(file);
          newImages.push({
            id: generateAdId(),
            imageUrl: base64,
            linkUrl: '',
          });
        }
      }

      if (newImages.length > 0) {
        onUpdate({ images: [...ad.images, ...newImages] });
        toast.success(`${newImages.length} image(s) ajoutée(s)`);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSlideImage = (id: string) => {
    onUpdate({ images: ad.images.filter(img => img.id !== id) });
  };

  const updateSlideImage = (id: string, updates: Partial<SlideImage>) => {
    onUpdate({
      images: ad.images.map(img => img.id === id ? { ...img, ...updates } : img),
    });
  };

  const moveSlideImage = (id: string, direction: 'up' | 'down') => {
    const images = [...ad.images];
    const index = images.findIndex(img => img.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    [images[index], images[newIndex]] = [images[newIndex], images[index]];
    onUpdate({ images });
  };

  const slideType = ad.slideType || 'images';

  // Check if ad has valid content
  const hasValidContent = slideType === 'propellerads' 
    ? !!ad.propellerZoneId 
    : ad.images.length > 0;

  return (
    <div className={`border rounded-lg p-4 space-y-4 transition-all ${
      ad.enabled 
        ? hasValidContent 
          ? 'bg-green-500/10 border-green-500/50' 
          : 'bg-yellow-500/10 border-yellow-500/50'
        : 'bg-muted/30 border-border/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GripVertical className="text-muted-foreground" size={18} />
          <div>
            <h5 className="font-medium text-foreground flex items-center gap-2">
              <RotateCcw size={14} />
              Pub en Slide
              {/* Status indicator */}
              {ad.enabled ? (
                hasValidContent ? (
                  <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-500 rounded-full font-medium">
                    ✓ Active
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-500 rounded-full font-medium">
                    ⚠ Config manquante
                  </span>
                )
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground rounded-full font-medium">
                  Désactivée
                </span>
              )}
            </h5>
            <p className="text-xs text-muted-foreground">Images ou PropellerAds</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={ad.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
          />
          <div className="flex gap-1">
            <button
              onClick={() => onMove('up')}
              disabled={isFirst}
              className="p-1.5 hover:bg-muted rounded disabled:opacity-30"
              title="Monter"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => onMove('down')}
              disabled={isLast}
              className="p-1.5 hover:bg-muted rounded disabled:opacity-30"
              title="Descendre"
            >
              <ArrowDown size={14} />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 hover:bg-destructive/20 text-destructive rounded"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {ad.enabled && (
        <div className="space-y-3 pt-2">
          {/* Slide Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdate({ slideType: 'images' })}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border-2 transition-all text-xs ${
                slideType === 'images'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <ImageIcon size={14} />
              Images (max 3)
            </button>
            <button
              onClick={() => onUpdate({ slideType: 'propellerads' })}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border-2 transition-all text-xs ${
                slideType === 'propellerads'
                  ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                  : 'border-border text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <Code size={14} />
              PropellerAds
            </button>
          </div>

          {slideType === 'images' ? (
            <>
              {/* Images list */}
              <div className="space-y-2">
                {ad.images.map((img, index) => (
                  <div
                    key={img.id}
                    className="flex gap-3 items-start p-2 bg-background/50 rounded border border-border/30"
                  >
                    <img
                      src={img.imageUrl}
                      alt={`Slide ${index + 1}`}
                      className="w-16 h-12 object-cover rounded"
                    />
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          Image {index + 1}
                        </span>
                        <div className="flex gap-0.5 ml-auto">
                          <button
                            onClick={() => moveSlideImage(img.id, 'up')}
                            disabled={index === 0}
                            className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => moveSlideImage(img.id, 'down')}
                            disabled={index === ad.images.length - 1}
                            className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            onClick={() => removeSlideImage(img.id)}
                            className="p-0.5 hover:bg-destructive/20 text-destructive rounded"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <Input
                        value={img.linkUrl}
                        onChange={(e) => updateSlideImage(img.id, { linkUrl: e.target.value })}
                        placeholder="URL de redirection"
                        className="bg-muted/50 text-xs h-7"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add image button */}
              {ad.images.length < 3 && (
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
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-dashed text-xs"
                  >
                    <Plus size={14} className="mr-1" />
                    Ajouter une image ({ad.images.length}/3)
                  </Button>
                </div>
              )}

              {/* Interval setting */}
              <div className="flex items-center gap-3">
                <Label className="text-xs text-foreground whitespace-nowrap">
                  Intervalle (sec):
                </Label>
                <Input
                  type="number"
                  min={3}
                  max={120}
                  value={ad.interval}
                  onChange={(e) => onUpdate({
                    interval: Math.max(3, Math.min(120, parseInt(e.target.value) || 30)),
                  })}
                  className="w-16 bg-muted/50 h-7 text-xs"
                />
              </div>
            </>
          ) : (
            /* PropellerAds config */
            <div className="space-y-3">
              <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <p className="text-xs text-orange-400 font-medium">🚀 PropellerAds - Idéal pour streaming</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Meilleurs revenus que AdSense pour les sites de streaming
                </p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Zone ID PropellerAds</Label>
                <Input
                  value={ad.propellerZoneId || ''}
                  onChange={(e) => onUpdate({ propellerZoneId: e.target.value })}
                  placeholder="Ex: 10454807"
                  className="bg-muted/50 text-xs h-7"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Format de publicité</Label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdate({ propellerFormat: 'banner' })}
                    className={`py-1.5 px-2 rounded text-xs border transition-all ${
                      (ad.propellerFormat || 'banner') === 'banner'
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    Bannière
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ propellerFormat: 'native' })}
                    className={`py-1.5 px-2 rounded text-xs border transition-all ${
                      ad.propellerFormat === 'native'
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    Native
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ propellerFormat: 'popunder' })}
                    className={`py-1.5 px-2 rounded text-xs border transition-all ${
                      ad.propellerFormat === 'popunder'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    Pop-under
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ propellerFormat: 'interstitial' })}
                    className={`py-1.5 px-2 rounded text-xs border transition-all ${
                      ad.propellerFormat === 'interstitial'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    Interstitiel
                  </button>
                </div>
                {(ad.propellerFormat === 'popunder' || ad.propellerFormat === 'interstitial') && (
                  <p className="text-[10px] text-purple-400 mt-1">
                    ⚡ Ce format s'affiche en plein écran ou dans un nouvel onglet
                  </p>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground">
                📝 Créez un compte sur <a href="https://propellerads.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">propellerads.com</a>, créez une zone pub et copiez l'ID ici.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface StaticAdEditorProps {
  ad: StaticAd;
  onUpdate: (updates: Partial<StaticAd>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
  side: 'left' | 'right';
}

const StaticAdEditor = ({ ad, onUpdate, onRemove, onMove, isFirst, isLast, side }: StaticAdEditorProps) => {
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await fileToBase64(file);
        onUpdate({ imageUrl: base64 });
        toast.success('Image ajoutée');
      } catch {
        toast.error('Erreur lors du chargement');
      }
    }
  };

  // Check if ad has valid content
  const hasValidContent = ad.adType === 'propellerads' 
    ? !!ad.propellerZoneId 
    : ad.adType === 'adsense' 
      ? !!ad.adsenseCode 
      : !!ad.imageUrl;

  return (
    <div className={`border rounded-lg p-4 space-y-4 transition-all ${
      ad.enabled 
        ? hasValidContent 
          ? 'bg-green-500/10 border-green-500/50' 
          : 'bg-yellow-500/10 border-yellow-500/50'
        : 'bg-muted/30 border-border/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GripVertical className="text-muted-foreground" size={18} />
          <div>
            <h5 className="font-medium text-foreground flex items-center gap-2">
              <ImageIcon size={14} />
              Pub Statique
              {/* Status indicator */}
              {ad.enabled ? (
                hasValidContent ? (
                  <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-500 rounded-full font-medium">
                    ✓ Active
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-500 rounded-full font-medium">
                    ⚠ Config manquante
                  </span>
                )
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground rounded-full font-medium">
                  Désactivée
                </span>
              )}
            </h5>
            <p className="text-xs text-muted-foreground">Image, AdSense ou PropellerAds</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={ad.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
          />
          <div className="flex gap-1">
            <button
              onClick={() => onMove('up')}
              disabled={isFirst}
              className="p-1.5 hover:bg-muted rounded disabled:opacity-30"
              title="Monter"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => onMove('down')}
              disabled={isLast}
              className="p-1.5 hover:bg-muted rounded disabled:opacity-30"
              title="Descendre"
            >
              <ArrowDown size={14} />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 hover:bg-destructive/20 text-destructive rounded"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {ad.enabled && (
        <div className="space-y-3 pt-2">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onUpdate({ adType: 'image' })}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border-2 transition-all text-xs ${
                ad.adType === 'image'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <ImageIcon size={12} />
              Image
            </button>
            <button
              onClick={() => onUpdate({ adType: 'adsense' })}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border-2 transition-all text-xs ${
                ad.adType === 'adsense'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <Code size={12} />
              AdSense
            </button>
            <button
              onClick={() => onUpdate({ adType: 'propellerads' })}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border-2 transition-all text-xs ${
                ad.adType === 'propellerads'
                  ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                  : 'border-border text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <Code size={12} />
              Propeller
            </button>
          </div>

          {ad.adType === 'image' ? (
            <div className="space-y-2">
              {/* Image preview/upload */}
              {ad.imageUrl ? (
                <div className="relative">
                  <img
                    src={ad.imageUrl}
                    alt="Static ad"
                    className="w-full max-h-24 object-contain rounded-lg bg-muted/30"
                  />
                  <button
                    onClick={() => onUpdate({ imageUrl: '' })}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`static-file-${ad.id}-${side}`}
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor={`static-file-${ad.id}-${side}`}
                    className="flex flex-col items-center gap-1 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-muted-foreground transition-colors"
                  >
                    <Upload size={18} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Cliquez pour uploader
                    </span>
                  </label>
                </div>
              )}

              {/* URL input */}
              <div className="space-y-1">
                <Label className="text-xs">Ou URL de l'image</Label>
                <Input
                  value={ad.imageUrl.startsWith('data:') ? '' : ad.imageUrl}
                  onChange={(e) => onUpdate({ imageUrl: e.target.value })}
                  placeholder="https://example.com/image.png"
                  className="bg-muted/50 text-xs h-7"
                />
              </div>

              {/* Link URL */}
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Link2 size={12} />
                  URL de redirection
                </Label>
                <Input
                  value={ad.linkUrl}
                  onChange={(e) => onUpdate({ linkUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="bg-muted/50 text-xs h-7"
                />
              </div>
            </div>
          ) : ad.adType === 'adsense' ? (
            <div className="space-y-2">
              <Label className="text-xs">Code d'unité publicitaire AdSense</Label>
              <textarea
                value={ad.adsenseCode}
                onChange={(e) => onUpdate({ adsenseCode: e.target.value })}
                placeholder={'<ins class="adsbygoogle"\n     style="display:block"\n     data-ad-client="ca-pub-XXXXXX"\n     data-ad-slot="XXXXXX"\n     data-ad-format="auto"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>'}
                className="w-full h-24 bg-muted/50 border border-border rounded-lg p-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground">
                ⚠️ Le script principal AdSense est déjà dans le site. Collez ici uniquement le code de l'unité publicitaire (balise &lt;ins&gt; + push).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <p className="text-xs text-orange-400 font-medium">🚀 PropellerAds - Idéal pour streaming</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Meilleurs revenus que AdSense pour les sites de streaming
                </p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Zone ID PropellerAds</Label>
                <Input
                  value={ad.propellerZoneId || ''}
                  onChange={(e) => onUpdate({ propellerZoneId: e.target.value })}
                  placeholder="Ex: 1234567"
                  className="bg-muted/50 text-xs h-7"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Format de publicité</Label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdate({ propellerFormat: 'banner' })}
                    className={`py-1.5 px-2 rounded text-xs border transition-all ${
                      ad.propellerFormat === 'banner'
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    Bannière
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ propellerFormat: 'native' })}
                    className={`py-1.5 px-2 rounded text-xs border transition-all ${
                      ad.propellerFormat === 'native'
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    Native
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ propellerFormat: 'popunder' })}
                    className={`py-1.5 px-2 rounded text-xs border transition-all ${
                      ad.propellerFormat === 'popunder'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    Pop-under
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ propellerFormat: 'interstitial' })}
                    className={`py-1.5 px-2 rounded text-xs border transition-all ${
                      ad.propellerFormat === 'interstitial'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                        : 'border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    Interstitiel
                  </button>
                </div>
                {(ad.propellerFormat === 'popunder' || ad.propellerFormat === 'interstitial') && (
                  <p className="text-[10px] text-purple-400 mt-1">
                    ⚡ Ce format s'affiche en plein écran ou dans un nouvel onglet
                  </p>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground">
                📝 Créez un compte sur <a href="https://propellerads.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">propellerads.com</a>, créez une zone pub et copiez l'ID ici.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SideAdsEditorProps {
  side: 'left' | 'right';
  ads: Ad[];
  onAddSlide: () => void;
  onAddStatic: () => void;
  onUpdateAd: (adId: string, updates: Partial<Ad>) => void;
  onRemoveAd: (adId: string) => void;
  onMoveAd: (adId: string, direction: 'up' | 'down') => void;
}

const SideAdsEditor = ({ side, ads, onAddSlide, onAddStatic, onUpdateAd, onRemoveAd, onMoveAd }: SideAdsEditorProps) => {
  const label = side === 'left' ? 'Gauche' : 'Droite';
  const sortedAds = [...ads].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-card/50 border border-border/50 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-lg">Côté {label}</h3>
        <span className="text-sm text-muted-foreground">{ads.length} pub(s)</span>
      </div>

      {/* Ads list */}
      <div className="space-y-3">
        {sortedAds.map((ad, index) => (
          ad.type === 'slide' ? (
            <SlideAdEditor
              key={ad.id}
              ad={ad}
              onUpdate={(updates) => onUpdateAd(ad.id, updates)}
              onRemove={() => onRemoveAd(ad.id)}
              onMove={(dir) => onMoveAd(ad.id, dir)}
              isFirst={index === 0}
              isLast={index === sortedAds.length - 1}
            />
          ) : (
            <StaticAdEditor
              key={ad.id}
              ad={ad}
              onUpdate={(updates) => onUpdateAd(ad.id, updates)}
              onRemove={() => onRemoveAd(ad.id)}
              onMove={(dir) => onMoveAd(ad.id, dir)}
              isFirst={index === 0}
              isLast={index === sortedAds.length - 1}
              side={side}
            />
          )
        ))}
      </div>

      {/* Add buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddSlide}
          className="flex-1"
        >
          <Plus size={14} className="mr-1" />
          Pub Slide
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddStatic}
          className="flex-1"
        >
          <Plus size={14} className="mr-1" />
          Pub Statique
        </Button>
      </div>
    </div>
  );
};

// Preview component showing ad placement mockup
const AdPreviewMockup = ({ settings }: { settings: { left: { ads: Ad[] }; right: { ads: Ad[] }; heroSyncEnabled: boolean } }) => {
  const getActiveAdsCount = (ads: Ad[]) => ads.filter(ad => {
    if (!ad.enabled) return false;
    if (ad.type === 'slide') {
      const slideType = ad.slideType || 'images';
      return slideType === 'propellerads' ? !!ad.propellerZoneId : ad.images.length > 0;
    }
    if (ad.type === 'static') {
      if (ad.adType === 'adsense') return !!ad.adsenseCode;
      if (ad.adType === 'propellerads') return !!ad.propellerZoneId;
      return !!ad.imageUrl;
    }
    return false;
  }).length;

  const leftActiveCount = getActiveAdsCount(settings.left.ads);
  const rightActiveCount = getActiveAdsCount(settings.right.ads);

  const renderAdPlaceholder = (ad: Ad, index: number) => {
    const isActive = ad.enabled;
    const hasContent = ad.type === 'slide' 
      ? (ad.slideType === 'propellerads' ? !!ad.propellerZoneId : ad.images.length > 0)
      : (ad.adType === 'propellerads' ? !!ad.propellerZoneId : ad.adType === 'adsense' ? !!ad.adsenseCode : !!ad.imageUrl);
    
    const adType = ad.type === 'slide' 
      ? (ad.slideType === 'propellerads' ? 'Propeller' : 'Slide')
      : (ad.adType === 'propellerads' ? 'Propeller' : ad.adType === 'adsense' ? 'AdSense' : 'Image');

    return (
      <div
        key={ad.id}
        className={`rounded border-2 border-dashed p-2 text-center transition-all ${
          isActive && hasContent
            ? 'border-green-500 bg-green-500/20'
            : isActive && !hasContent
              ? 'border-yellow-500 bg-yellow-500/20'
              : 'border-muted-foreground/30 bg-muted/30'
        }`}
      >
        <span className={`text-[9px] font-medium ${
          isActive && hasContent ? 'text-green-500' : isActive ? 'text-yellow-500' : 'text-muted-foreground'
        }`}>
          {adType} {index + 1}
        </span>
        {isActive && hasContent && (
          <div className="text-[8px] text-green-400 mt-0.5">✓ Active</div>
        )}
        {isActive && !hasContent && (
          <div className="text-[8px] text-yellow-400 mt-0.5">⚠ Config</div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Eye size={16} />
          Aperçu du placement
        </h3>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">
            {leftActiveCount + rightActiveCount} active(s)
          </span>
        </div>
      </div>

      {/* Mockup Layout */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        {/* Header mockup */}
        <div className="h-8 bg-muted/50 border-b border-border flex items-center px-3">
          <div className="w-16 h-3 bg-primary/30 rounded" />
          <div className="flex-1" />
          <div className="flex gap-2">
            <div className="w-8 h-3 bg-muted rounded" />
            <div className="w-8 h-3 bg-muted rounded" />
          </div>
        </div>

        {/* Main content with side ads */}
        <div className="flex min-h-[200px]">
          {/* Left ads column */}
          <div className="w-20 p-1.5 bg-muted/20 border-r border-border/50 space-y-1.5">
            <div className="text-[8px] text-muted-foreground text-center font-medium mb-1">GAUCHE</div>
            {settings.left.ads.length > 0 ? (
              [...settings.left.ads].sort((a, b) => a.order - b.order).map((ad, i) => renderAdPlaceholder(ad, i))
            ) : (
              <div className="h-12 rounded border border-dashed border-muted-foreground/20 flex items-center justify-center">
                <span className="text-[8px] text-muted-foreground">Vide</span>
              </div>
            )}
          </div>

          {/* Main content mockup */}
          <div className="flex-1 p-3 space-y-2">
            {/* Hero mockup */}
            <div className="h-16 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
              <span className="text-xs text-primary/60 font-medium">Hero Slider</span>
            </div>
            {/* Content grid mockup */}
            <div className="grid grid-cols-4 gap-1.5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 bg-muted/40 rounded" />
              ))}
            </div>
          </div>

          {/* Right ads column */}
          <div className="w-20 p-1.5 bg-muted/20 border-l border-border/50 space-y-1.5">
            <div className="text-[8px] text-muted-foreground text-center font-medium mb-1">DROITE</div>
            {settings.right.ads.length > 0 ? (
              [...settings.right.ads].sort((a, b) => a.order - b.order).map((ad, i) => renderAdPlaceholder(ad, i))
            ) : (
              <div className="h-12 rounded border border-dashed border-muted-foreground/20 flex items-center justify-center">
                <span className="text-[8px] text-muted-foreground">Vide</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-dashed border-green-500 bg-green-500/20" />
          <span className="text-muted-foreground">Active</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-dashed border-yellow-500 bg-yellow-500/20" />
          <span className="text-muted-foreground">Config manquante</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-dashed border-muted-foreground/30 bg-muted/30" />
          <span className="text-muted-foreground">Désactivée</span>
        </div>
      </div>
    </div>
  );
};

const AdvancedAdsEditor = () => {
  const [showPreview, setShowPreview] = useState(true);
  const { 
    localSettings, 
    saving, 
    hasChanges,
    addAd,
    removeAd,
    updateAd,
    moveAd,
    toggleHeroSync,
    saveAllChanges,
    discardChanges,
  } = useAdSettings();

  const getNextOrder = (side: 'left' | 'right') => {
    const ads = localSettings[side].ads;
    return ads.length > 0 ? Math.max(...ads.map(a => a.order)) + 1 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Publicités</h2>
          <p className="text-muted-foreground text-sm">
            Configurez les publicités affichées sur les côtés du site.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1.5"
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? 'Masquer aperçu' : 'Aperçu'}
          </Button>
          {hasChanges && (
            <Button
              variant="outline"
              onClick={discardChanges}
              disabled={saving}
            >
              Annuler
            </Button>
          )}
          <Button
            onClick={saveAllChanges}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Preview Mockup */}
      {showPreview && (
        <AdPreviewMockup settings={localSettings} />
      )}

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-sm text-amber-600 dark:text-amber-400">
          Vous avez des modifications non sauvegardées.
        </div>
      )}

      {/* Explanation */}
      <div className="bg-muted/30 border border-border/30 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Comment ça marche ?</p>
        <ul className="space-y-1">
          <li><strong>Pubs en slide</strong> : Jusqu'à 3 images en rotation automatique ou PropellerAds</li>
          <li><strong>Pubs statiques</strong> : Image fixe, AdSense ou PropellerAds</li>
          <li>Ajoutez autant de pubs que vous voulez sur chaque côté</li>
          <li>Réorganisez-les avec les flèches haut/bas</li>
          <li className="text-green-500">🟢 Vert = Pub active et configurée</li>
          <li className="text-yellow-500">🟡 Jaune = Pub active mais configuration manquante</li>
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
            checked={localSettings.heroSyncEnabled}
            onCheckedChange={toggleHeroSync}
          />
        </div>
      </div>

      {/* Left Side Editor */}
      <SideAdsEditor
        side="left"
        ads={localSettings.left.ads}
        onAddSlide={() => addAd('left', createSlideAd(getNextOrder('left')))}
        onAddStatic={() => addAd('left', createStaticAd(getNextOrder('left')))}
        onUpdateAd={(id, updates) => updateAd('left', id, updates)}
        onRemoveAd={(id) => removeAd('left', id)}
        onMoveAd={(id, dir) => moveAd('left', id, dir)}
      />

      {/* Right Side Editor */}
      <SideAdsEditor
        side="right"
        ads={localSettings.right.ads}
        onAddSlide={() => addAd('right', createSlideAd(getNextOrder('right')))}
        onAddStatic={() => addAd('right', createStaticAd(getNextOrder('right')))}
        onUpdateAd={(id, updates) => updateAd('right', id, updates)}
        onRemoveAd={(id) => removeAd('right', id)}
        onMoveAd={(id, dir) => moveAd('right', id, dir)}
      />
    </div>
  );
};

export default AdvancedAdsEditor;
