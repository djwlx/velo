import { useEffect, useRef, useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface TruncatedTextProps {
  text: string;
  className?: string;
}

export function TruncatedText({ text, className }: TruncatedTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const node = textRef.current;
    if (!node) return;

    const update = () => setTruncated(node.scrollWidth > node.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [text]);

  return (
    <Tooltip>
      <span
        className={cn('relative inline-flex max-w-full min-w-0', className)}
      >
        <span ref={textRef} className="min-w-0 truncate">
          {text}
        </span>
        <TooltipTrigger
          disabled={!truncated}
          className="absolute inset-y-0 right-0 w-4 cursor-default"
          render={<span />}
        />
      </span>
      <TooltipContent className="max-w-[50vw] break-all">{text}</TooltipContent>
    </Tooltip>
  );
}
