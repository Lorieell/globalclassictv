import { useState } from 'react';
import { Instagram, Youtube, Twitter, MessageCircle, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logoImage from '@/assets/logo.png';

// Reddit icon component
const RedditIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

interface SocialLinks {
  instagram: string;
  youtube: string;
  twitter: string;
  reddit: string;
  discord: string;
  shop: string;
}

interface FooterProps {
  isAdmin?: boolean;
}

const SOCIAL_STORAGE_KEY = 'gctv-social-links';

const defaultLinks: SocialLinks = {
  instagram: 'https://instagram.com',
  youtube: 'https://youtube.com',
  twitter: 'https://twitter.com',
  reddit: 'https://reddit.com',
  discord: 'https://discord.gg',
  shop: 'https://globaldealr.com',
};

const Footer = ({ isAdmin }: FooterProps) => {
  const [showEditor, setShowEditor] = useState(false);
  const [links, setLinks] = useState<SocialLinks>(() => {
    const stored = localStorage.getItem(SOCIAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultLinks;
  });
  const [editLinks, setEditLinks] = useState<SocialLinks>(links);

  const handleSave = () => {
    setLinks(editLinks);
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(editLinks));
    setShowEditor(false);
  };

  const socialItems = [
    { key: 'instagram', icon: Instagram, label: 'Instagram' },
    { key: 'youtube', icon: Youtube, label: 'YouTube' },
    { key: 'twitter', icon: Twitter, label: 'Twitter' },
    { key: 'reddit', icon: RedditIcon, label: 'Reddit' },
    { key: 'discord', icon: MessageCircle, label: 'Discord' },
  ];

  return (
    <>
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Logo" className="h-10 w-auto" />
              <span className="font-display text-xl font-bold text-foreground">GCTV</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialItems.map(({ key, icon: Icon, label }) => (
                <a
                  key={key}
                  href={links[key as keyof SocialLinks]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all duration-200 text-muted-foreground"
                  title={label}
                >
                  <Icon size={20} />
                </a>
              ))}
              
              {/* Shop Link */}
              <a
                href={links.shop}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 text-foreground border border-primary/30 transition-all duration-200"
              >
                <ExternalLink size={16} />
                <span className="text-sm font-medium">Shop</span>
              </a>

              {/* Admin Edit Button */}
              {isAdmin && (
                <Button
                  onClick={() => {
                    setEditLinks(links);
                    setShowEditor(true);
                  }}
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-primary hover:bg-primary/10"
                >
                  <Settings size={18} />
                </Button>
              )}
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © 2026 GCTV. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

      {/* Social Links Editor Modal */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Modifier les liens</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {socialItems.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label className="text-foreground">{label}</Label>
                <Input
                  value={editLinks[key as keyof SocialLinks]}
                  onChange={(e) => setEditLinks(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={`URL ${label}`}
                  className="bg-muted border-border"
                />
              </div>
            ))}
            
            <div className="space-y-2">
              <Label className="text-foreground">Shop (GlobalDealr)</Label>
              <Input
                value={editLinks.shop}
                onChange={(e) => setEditLinks(prev => ({ ...prev, shop: e.target.value }))}
                placeholder="URL du shop"
                className="bg-muted border-border"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Footer;
