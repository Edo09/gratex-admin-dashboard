interface RegMarkProps {
  size?: number;
}

/** CMYK registration mark — brand glyph for the Press direction. */
export function RegMark({ size = 30 }: RegMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30">
      <circle cx="15" cy="15" r="13" fill="none" stroke="#0c0c0c" strokeWidth="1" />
      <line x1="15" y1="0" x2="15" y2="30" stroke="#0c0c0c" strokeWidth="1" />
      <line x1="0" y1="15" x2="30" y2="15" stroke="#0c0c0c" strokeWidth="1" />
      <circle cx="15" cy="15" r="3.5" fill="none" stroke="#0c0c0c" strokeWidth="1" />
    </svg>
  );
}
