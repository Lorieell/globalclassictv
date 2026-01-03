import { useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AdminLoginModal = ({ isOpen, onClose, onLogin }: AdminLoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!email || !password) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await onLogin(email, password);
      if (result.success) {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue dans le panneau d'administration",
        });
        setEmail('');
        setPassword('');
        onClose();
      } else {
        toast({
          title: "Erreur de connexion",
          description: result.error || "Identifiants incorrects ou accès non autorisé",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          Connectez-vous avec votre compte administrateur
        </p>

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Email"
            disabled={loading}
            className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Mot de passe"
            disabled={loading}
            className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-bold mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connexion...
            </>
          ) : (
            'Connexion'
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={onClose}
          disabled={loading}
          className="w-full mt-2 text-muted-foreground"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
};

export default AdminLoginModal;
