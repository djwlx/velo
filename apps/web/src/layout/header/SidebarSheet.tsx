import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Sidebar } from '../sidebar';

interface SidebarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SidebarSheet(props: SidebarSheetProps) {
  const { open, onOpenChange } = props;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="pt-6" side="left">
        <Sidebar onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
