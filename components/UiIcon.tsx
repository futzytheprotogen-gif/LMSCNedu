import type { ReactNode } from "react";

export type UiIconName =
  | "arrow-left"
  | "book"
  | "chart"
  | "checklist"
  | "clipboard"
  | "classroom"
  | "info"
  | "layers"
  | "logout"
  | "search"
  | "students"
  | "teacher"
  | "trophy"
  | "user-plus";

const ikon: Record<UiIconName, ReactNode> = {
  "arrow-left": <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  book: <><path d="M12 7v14" /><path d="M3 18V5.8a1.8 1.8 0 0 1 2.3-1.7L12 6l6.7-1.9A1.8 1.8 0 0 1 21 5.8V18l-9 3-9-3Z" /><path d="M3 18h18" /></>,
  chart: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></>,
  checklist: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m8 9 1.5 1.5L12 8m2 1h3m-9 6 1.5 1.5L12 14m2 1h3" /></>,
  clipboard: <><rect x="5" y="5" width="14" height="16" rx="2" /><path d="M9 5.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M9 11h6m-6 4h6" /></>,
  classroom: <><path d="M3 9h18v11H3z" /><path d="M7 9V5h10v4" /><path d="M7 13h4m2 0h4M7 17h4m2 0h4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></>,
  logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
  students: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1" /><path d="M17 5.5a3 3 0 0 1 0 5.8" /><path d="M18 14a5 5 0 0 1 3 4.6V20" /></>,
  teacher: <><circle cx="8" cy="7" r="3" /><path d="M2.5 20v-1a5.5 5.5 0 0 1 11 0v1" /><path d="M15 5h6v11h-6" /><path d="M16.5 8h3m-3 3h3" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4" /><path d="M12 13v5m-4 3h8m-7-3h6" /></>,
  "user-plus": <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1" /><path d="M19 8v6m-3-3h6" /></>,
};

export default function UiIcon({
  name,
  className,
  size = 20,
}: {
  name: UiIconName;
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      width={size}
    >
      {ikon[name]}
    </svg>
  );
}
