import { usePlayerGestures } from '../hooks/usePlayerGestures';

export function PlayerGestures() {
  const boosting = usePlayerGestures();

  return boosting ? (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
    >
      <span className="rounded-md bg-(--media-controls) px-4 py-2 text-lg font-semibold text-(--media-foreground)">
        2×
      </span>
    </span>
  ) : null;
}
