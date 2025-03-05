import { cn } from '~web/utils/helpers';

export const ChevronRight = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    className={cn(['lucide lucide-chevron-right', className])}
  >
    <title>Chevron Right</title>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
export const CopyX = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(['lucide lucide-copy-x', className])}
  >
    <title>Copy X</title>
    <line x1="12" x2="18" y1="12" y2="18" />
    <line x1="12" x2="18" y1="18" y2="12" />
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const SHOW_DOT = false;
export const Notification = ({
  className = '',
  size = 24,
  events = [],
}: {
  className?: string;
  size?: number;
  events: boolean[];
}) => {
  const hasHighSeverity = events.includes(true);
  const totalSevere = events.filter((e) => e).length;
  const displayCount = totalSevere > 99 ? '>99' : totalSevere;
  const badgeSize = hasHighSeverity
    ? Math.max(size * 0.6, 14)
    : Math.max(size * 0.4, 6);

  return (
    <div className="relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        className={`lucide lucide-bell ${className}`}
      >
        <title>Bell</title>
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
      </svg>
      {events.length > 0 && (SHOW_DOT || totalSevere > 0) && (
        <div
          className={cn([
            'absolute',
            hasHighSeverity ? '-top-2.5 -right-2.5' : '-top-1 -right-1',
            'rounded-full',
            'flex items-center justify-center',
            'text-[8px] font-medium text-white',
            'aspect-square',
            hasHighSeverity ? 'bg-red-500/90' : 'bg-purple-500/90',
          ])}
          style={{
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            padding: hasHighSeverity ? '0.5px' : '0',
          }}
        >
          {hasHighSeverity && displayCount}
        </div>
      )}
    </div>
  );
};

export const CloseIcon = ({
  className = '',
  size = 24,
}: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    className={className}
  >
    <title>Close</title>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
export const VolumeOnIcon = ({
  className = '',
  size = 24,
}: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    className={className}
  >
    <title>Volume On</title>
    <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
    <path d="M16 9a5 5 0 0 1 0 6" />
    <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
  </svg>
);

export const VolumeOffIcon = ({
  className = '',
  size = 24,
}: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    className={className}
  >
    <title>Volume Off</title>
    <path d="M16 9a5 5 0 0 1 .95 2.293" />
    <path d="M19.364 5.636a9 9 0 0 1 1.889 9.96" />
    <path d="m2 2 20 20" />
    <path d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11" />
    <path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686" />
  </svg>
);

export const ArrowLeft = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    className={cn(['lucide lucide-arrow-left', className])}
  >
    <title>Arrow Left</title>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

export const PointerIcon = ({
  className = '',
  size = 24,
}: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    className={className}
  >
    <title>Pointer</title>
    <path d="M14 4.1 12 6" />
    <path d="m5.1 8-2.9-.8" />
    <path d="m6 12-1.9 2" />
    <path d="M7.2 2.2 8 5.1" />
    <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
  </svg>
);

export const KeyboardIcon = ({
  className = '',
  size = 24,
}: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    className={className}
  >
    <title>Keyboard</title>
    <path d="M10 8h.01" />
    <path d="M12 12h.01" />
    <path d="M14 8h.01" />
    <path d="M16 12h.01" />
    <path d="M18 8h.01" />
    <path d="M6 8h.01" />
    <path d="M7 16h10" />
    <path d="M8 12h.01" />
    <rect width="20" height="16" x="2" y="4" rx="2" />
  </svg>
);
export const ClearIcon = ({
  className = '',
  size = 24,
}: { className?: string; size?: number }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className={className}
      style={{ transform: 'rotate(180deg)' }}
    >
      <title>Clear</title>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  );
};
export const TrendingDownIcon = ({
  className = '',
  size = 24,
}: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <title>Trending Down</title>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </svg>
);
