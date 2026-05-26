import type { CSSProperties, ReactElement, ReactNode } from "react";

interface IconProps {
  d?: ReactNode | string;
  size?: number;
  sw?: number;
  fill?: string;
  style?: CSSProperties;
}

function Icon({ d, size = 18, sw = 1.5, fill = "none", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {typeof d === "string" ? <path d={d} /> : d}
    </svg>
  );
}

type IconComponent = (props: Omit<IconProps, "d">) => ReactElement;

/** Inline-SVG icon set used by the Press direction. 1.5px stroke, currentColor. */
export const Icons: Record<string, IconComponent> = {
  search: (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />,
  plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  close: (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18" />,
  chevron: (p) => <Icon {...p} d="m6 9 6 6 6-6" />,
  chevronRight: (p) => <Icon {...p} d="m9 6 6 6-6 6" />,
  chevronLeft: (p) => <Icon {...p} d="m15 6-6 6 6 6" />,
  arrowUp: (p) => <Icon {...p} d="M7 17 17 7M7 7h10v10" />,
  arrowDown: (p) => <Icon {...p} d="M17 7 7 17M17 17H7V7" />,
  external: (p) => (
    <Icon {...p} d={<><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" /></>} />
  ),
  sun: (p) => (
    <Icon {...p} d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>} />
  ),
  bell: (p) => (
    <Icon {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>} />
  ),
  upload: (p) => (
    <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8 12 3 7 8" /><path d="M12 3v12" /></>} />
  ),
  trash: (p) => (
    <Icon {...p} d={<><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>} />
  ),
  edit: (p) => <Icon {...p} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />,
  download: (p) => (
    <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>} />
  ),
  print: (p) => (
    <Icon {...p} d={<><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="9" rx="1.5" /><path d="M6 14h12v7H6z" /></>} />
  ),
  filter: (p) => <Icon {...p} d="M3 5h18l-7 9v6l-4-2v-4z" />,
  dashboard: (p) => (
    <Icon
      {...p}
      d={
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
      }
    />
  ),
  fileText: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </>
      }
    />
  ),
  receipt: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2z" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
        </>
      }
    />
  ),
  users: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      }
    />
  ),
  hash: (p) => (
    <Icon
      {...p}
      d={
        <>
          <line x1="4" y1="9" x2="20" y2="9" />
          <line x1="4" y1="15" x2="20" y2="15" />
          <line x1="10" y1="3" x2="8" y2="21" />
          <line x1="16" y1="3" x2="14" y2="21" />
        </>
      }
    />
  ),
  settings: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </>
      }
    />
  ),
};
