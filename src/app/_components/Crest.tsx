// The club's emblem: a cocktail glass in a ring. Our own mark, not Yale's seal.
export default function Crest({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" className={className} aria-hidden="true">
      <circle cx="28" cy="28" r="27" fill="#00356b" />
      <circle cx="28" cy="28" r="23" fill="none" stroke="#b8955a" strokeWidth="0.9" />
      <circle cx="28" cy="28" r="21.5" fill="none" stroke="#f5efe3" strokeWidth="0.4" opacity="0.6" />
      <path d="M17.5 18.5h21L28 31z" fill="none" stroke="#f5efe3" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M21 22.5h14" stroke="#f5efe3" strokeWidth="0.9" />
      <circle cx="33.5" cy="17" r="2" fill="none" stroke="#b8955a" strokeWidth="1.2" />
      <path d="M28 31v8.5M22.5 39.5h11" stroke="#f5efe3" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Crest + "SOM COCKTAIL CLUB", used at the top of student pages and the login page.
export function MenuHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Crest />
      <div className="eyebrow mt-3">SOM Cocktail Club</div>
      {subtitle && <div className="mt-1 text-xs text-ink/60">{subtitle}</div>}
    </div>
  );
}
