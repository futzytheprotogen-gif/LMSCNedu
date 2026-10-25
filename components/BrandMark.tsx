interface BrandMarkProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function BrandMark({ className, style }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      style={style}
      viewBox="0 0 40 40"
    >
      <path
        d="M20 3.5 33.5 9v10.2c0 8.3-4.8 13.7-13.5 17.3-8.7-3.6-13.5-9-13.5-17.3V9L20 3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12 16.2c2.8-2 5.4-2 8 0 2.6-2 5.2-2 8 0v10.3c-2.8-2-5.4-2-8 0-2.6-2-5.2-2-8 0V16.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M20 16v10.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="28" cy="11.5" r="2" fill="currentColor" />
      <path d="M28 13.5v2.7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
