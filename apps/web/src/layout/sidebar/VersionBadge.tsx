import { useRequestQuery } from '@/hooks/useRequestQuery';
import { getVersion } from '@/services/config';

export function VersionBadge() {
  const { data } = useRequestQuery(getVersion);
  const version = data?.data.version;

  if (!version) return null;

  return (
    <div className="mt-auto border-t border-sidebar-border px-3 pt-4 text-center text-xs text-muted-foreground">
      v{version}
    </div>
  );
}
