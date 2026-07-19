import { useCallback, useRef, useState, type ReactNode } from 'react';
import * as Icons from 'lucide-react';
import { haptic } from '../lib/haptics';

interface NativeScrollProps {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
  refreshable?: boolean;
  className?: string;
  contentClassName?: string;
}

const PULL_THRESHOLD = 70;
const PULL_RESISTANCE = 0.5;

export function NativeScroll({ children, onRefresh, refreshable = true, className = '', contentClassName = '' }: NativeScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
    } else {
      startYRef.current = null;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null || refreshing || !refreshable) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0 && scrollRef.current && scrollRef.current.scrollTop <= 0) {
      const resisted = delta * PULL_RESISTANCE;
      setPullDistance(Math.min(resisted, PULL_THRESHOLD * 1.5));
    }
  }, [refreshing, refreshable]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && onRefresh && !refreshing) {
      setRefreshing(true);
      haptic('medium');
      try { await onRefresh(); } finally {
        setTimeout(() => {
          setRefreshing(false);
          setPullDistance(0);
        }, 600);
      }
    } else {
      setPullDistance(0);
    }
    startYRef.current = null;
  }, [pullDistance, onRefresh, refreshing]);

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  const showIndicator = pullDistance > 0 || refreshing;

  return (
    <div
      ref={scrollRef}
      data-scroll-container
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`h-full overflow-y-auto overscroll-y-contain no-scrollbar ${className}`}
    >
      {showIndicator && (
        <div
          className="flex items-center justify-center py-3 transition-opacity"
          style={{ height: refreshing ? 44 : Math.max(0, pullDistance), opacity: refreshing ? 1 : progress }}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: `scale(${0.6 + progress * 0.4})` }}
          >
            <Icons.Loader2
              className={`w-5 h-5 ${refreshing ? 'text-pink-500' : progress >= 1 ? 'text-pink-500' : 'text-gray-300'}`}
              style={{ transform: `rotate(${progress * 270}deg)` }}
            />
          </div>
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
