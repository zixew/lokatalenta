export function BrandLogo({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="#0F766E" />
      <path
        d="M12 11V29H24"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 13H29M24.5 13V23"
        stroke="#99F6E4"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="29" cy="27.5" r="2.2" fill="#FDE68A" />
    </svg>
  );
}
