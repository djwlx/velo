import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Navigation, type NavigationSection } from './Navigation';
import { VersionBadge } from './VersionBadge';

const sidebarSurfaceClassName =
  'w-72 shrink-0 border-r bg-popover text-popover-foreground ';

interface SidebarProps {
  sections?: NavigationSection[];
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

function SidebarBody({
  sections,
  onNavigate,
}: {
  sections?: NavigationSection[];
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Navigation sections={sections} onNavigate={onNavigate} />
      <div className="mt-auto border-t">
        <VersionBadge />
      </div>
    </div>
  );
}

export function Sidebar({
  sections,
  mobileOpen,
  onMobileOpenChange,
}: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          sidebarSurfaceClassName,
          'hidden h-full md:flex md:flex-col'
        )}
      >
        <SidebarBody sections={sections} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className={cn(sidebarSurfaceClassName, 'p-0 pt-8 md:hidden')}
        >
          <SidebarBody
            sections={sections}
            onNavigate={() => onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
