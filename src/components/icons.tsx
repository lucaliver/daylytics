/** Small hand-rolled icons, kept in one place since several components each
 * need one or two. `currentColor` throughout so callers set color via
 * className, same convention as everything else that isn't mood-colored. */

type IconProps = { size?: number; className?: string };

export function CloseIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SortIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 6v12M7 6L4 9M7 6l3 3M17 18V6M17 18l3-3M17 18l-3-3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GripIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {[8, 16].map((cx) =>
        [6, 12, 18].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" fill="currentColor" />),
      )}
    </svg>
  );
}

export function UploadIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 15V4M12 4L7.5 8.5M12 4l4.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 15v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronUpIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SlidersIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 7h10M17 7h3M4 17h3M10 17h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="14" cy="7" r="2.25" fill="var(--color-surface)" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="7" cy="17" r="2.25" fill="var(--color-surface)" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function BadgeIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2.5l2.24 4.53 5 .73-3.62 3.53.85 4.98L12 13.9l-4.47 2.35.85-4.98-3.62-3.53 5-.73L12 2.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FlagIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 21V4M5 4h13l-3 4 3 4H5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoonIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M20.5 14.8A8.5 8.5 0 1 1 9.7 4a6.7 6.7 0 0 0 10.8 10.8z" fill="currentColor" />
    </svg>
  );
}

export function SunriseIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3v4M4.6 9.6l1.4 1.4M19.4 9.6L18 11M2 18h20M5 18a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FlameIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2c1.2 3-2.6 4.4-2.6 7.4a2.6 2.6 0 0 0 5.2 0c0-.8-.6-1.6-.6-1.6 1.8 1 2.8 2.8 2.8 4.6a4.8 4.8 0 0 1-9.6 0c0-4 3.6-5.2 4.8-10.4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MusicNoteIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9 18V5l10-2v13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function GhostIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3a7 7 0 0 0-7 7v10l2.3-2 2.2 2 2.5-2 2.5 2 2.2-2 2.3 2V10a7 7 0 0 0-7-7z"
        fill="currentColor"
      />
      <circle cx="9.5" cy="10.5" r="1.1" fill="var(--color-surface)" />
      <circle cx="14.5" cy="10.5" r="1.1" fill="var(--color-surface)" />
    </svg>
  );
}

export function LoopIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4.5 4.5v5h5M19.5 19.5v-5h-5M5 15a8 8 0 0 0 14 3.4M19 9a8 8 0 0 0-14-3.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 5.5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 1-2-2v-13zM20 5.5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 0 2-2v-13z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ZigzagIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3 16.5l4-9 4 7 4-11 3 8 3-5.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="18" cy="6" r="2.5" fill="currentColor" />
      <circle cx="6" cy="12" r="2.5" fill="currentColor" />
      <circle cx="18" cy="18" r="2.5" fill="currentColor" />
      <path
        d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DownloadIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 4v11M12 15l-4.5-4.5M12 15l4.5-4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 15v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrophyIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M8 4h8v4.5a4 4 0 0 1-8 0V4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M8 5H5.5a2.5 2.5 0 0 0 2.5 3.5M16 5h2.5A2.5 2.5 0 0 1 16 8.5M12 12.5v3M9 20h6M9.5 20a2.5 2.5 0 0 1 0-4.5h5a2.5 2.5 0 0 1 0 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M15.4 15.4L20 20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
