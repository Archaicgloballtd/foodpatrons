type IconProps = { size?: number; className?: string };

export function BurgerIcon({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path d="M7 16c0-6 6-10 13-10s13 4 13 10H7z" fill="#F97316" />
      <circle cx="13" cy="10" r="1.2" fill="#FFEDD5" />
      <circle cx="20" cy="8" r="1.2" fill="#FFEDD5" />
      <circle cx="27" cy="10" r="1.2" fill="#FFEDD5" />
      <rect x="7" y="17" width="26" height="3.5" rx="1.5" fill="#84CC16" />
      <rect x="6" y="21" width="28" height="5" rx="2" fill="#7C3E1D" />
      <rect x="7" y="27" width="26" height="3.5" rx="1.5" fill="#EF4444" />
      <path d="M6 31c0 3 6 5 14 5s14-2 14-5H6z" fill="#FDBA74" />
    </svg>
  );
}

export function PizzaIcon({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path d="M20 4 36 34a20 20 0 0 1-32 0L20 4z" fill="#FACC15" />
      <path d="M20 4 36 34a20 20 0 0 1-4.5 2.7L20 4z" fill="#F59E0B" />
      <circle cx="19" cy="18" r="2.4" fill="#EF4444" />
      <circle cx="26" cy="24" r="2.4" fill="#EF4444" />
      <circle cx="15" cy="27" r="2.4" fill="#EF4444" />
      <path d="M4 34a20 20 0 0 0 32 0" stroke="#EA580C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function DrinkIcon({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <rect x="12" y="6" width="5" height="8" rx="2" fill="#8B5CF6" transform="rotate(20 14.5 10)" />
      <path d="M10 13h20l-2.5 21a3 3 0 0 1-3 2.7h-9a3 3 0 0 1-3-2.7L10 13z" fill="#14B8A6" />
      <path d="M10 13h20l-.8 6.5H10.8L10 13z" fill="#5EEAD4" />
      <path d="M15 19l1.5 15M20 19v15M25 19l-1.5 15" stroke="#0F766E" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function DonutIcon({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <circle cx="20" cy="20" r="16" fill="#FB923C" />
      <circle cx="20" cy="20" r="16" fill="#FF6B6B" opacity="0.85" />
      <circle cx="20" cy="20" r="6" fill="#FAFAFA" />
      <circle cx="13" cy="15" r="1.6" fill="#FACC15" />
      <circle cx="27" cy="14" r="1.6" fill="#8B5CF6" />
      <circle cx="29" cy="22" r="1.6" fill="#14B8A6" />
      <circle cx="14" cy="27" r="1.6" fill="#FACC15" />
      <circle cx="22" cy="29" r="1.6" fill="#8B5CF6" />
    </svg>
  );
}

export function NoodleBowlIcon({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path d="M6 18h28a14 15 0 0 1-28 0z" fill="#F97316" />
      <path d="M6 18h28a14 15 0 0 1-28 0z" fill="#1B2560" opacity="0.08" />
      <ellipse cx="20" cy="18" rx="14" ry="4" fill="#FFF7ED" />
      <path d="M12 15c2 2 2 4 0 6M20 14c2 2 2 5 0 7M28 15c2 2 2 4 0 6" stroke="#F59E0B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <rect x="26" y="4" width="2" height="14" rx="1" fill="#7C3E1D" transform="rotate(12 27 11)" />
      <rect x="29" y="4" width="2" height="14" rx="1" fill="#7C3E1D" transform="rotate(12 30 11)" />
    </svg>
  );
}
