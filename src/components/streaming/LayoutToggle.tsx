import { LayoutGrid, Rows3, LayoutList, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type LayoutType = 'grid' | 'carousel' | 'list' | 'compact';

interface LayoutToggleProps {
  currentLayout: LayoutType;
  onChange: (layout: LayoutType) => void;
}

const layouts = [
  { id: 'grid' as LayoutType, label: 'Grille', icon: LayoutGrid, description: 'Affichage en grille classique' },
  { id: 'carousel' as LayoutType, label: 'Carousel', icon: Play, description: 'Défilement automatique' },
  { id: 'list' as LayoutType, label: 'Liste', icon: LayoutList, description: 'Liste verticale avec détails' },
  { id: 'compact' as LayoutType, label: 'Compact', icon: Rows3, description: 'Grille compacte' },
];

const LayoutToggle = ({ currentLayout, onChange }: LayoutToggleProps) => {
  const current = layouts.find(l => l.id === currentLayout) || layouts[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
          <current.icon size={16} />
          {current.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border w-56">
        {layouts.map(({ id, label, icon: Icon, description }) => (
          <DropdownMenuItem
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-3 cursor-pointer ${currentLayout === id ? 'bg-primary/10 text-primary' : ''}`}
          >
            <Icon size={18} />
            <div className="flex flex-col">
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LayoutToggle;
