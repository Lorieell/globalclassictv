import { useState } from 'react';
import { X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (code: string) => boolean;
}

const AdminLoginModal = ({ isOpen, onClose, onLogin }: AdminLoginModalProps) => {
  const [code, setCode] = useState('');
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (onLogin(code)) {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans le panneau d'administration",
      });
      setCode('');
      onClose();
    } else {
      toast({
        title: "Code incorrect",
        description: "Veuillez réessayer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-card rounded-3xl p-8 border border-border/50 shadow-card animate-scale-in">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Shield size={32} className="text-primary" />
          </div>
        </div>
        
        <h2 className="font-display text-2xl font-bold text-center mb-2 text-foreground">
          Accès Admin
        </h2>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Entrez le code d'administration
        </p>

        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="••••••••"
          className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 mb-4 text-center text-lg tracking-widest text-foreground placeholder:text-muted-foreground"
        />

        <Button
          onClick={handleSubmit}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-bold"
        >
          Connexion
        </Button>

        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full mt-2 text-muted-foreground"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
};

export default AdminLoginModal;
