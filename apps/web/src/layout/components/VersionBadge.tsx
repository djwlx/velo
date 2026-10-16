import { useRequestQuery } from '@/hooks/useRequestQuery';
import { getVersion } from '@/services/config';

export function VersionBadge() {
  const { data } = useRequestQuery(getVersion);
  const version = data?.data.version;

  if (!version) return null;

  return (
    <div className="px-3 py-2 text-center text-xs text-muted-foreground">
      v{version}
    </div>
  );
}
