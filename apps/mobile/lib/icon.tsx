import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from './theme';

const PATHS: Record<string, { d?: string[]; circles?: [number, number, number][]; rects?: [number, number, number, number, number][] }> = {
  bell: { d: ['M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z', 'M10 21h4'] },
  check: { d: ['M5 12.5l4.5 4.5L19 7.5'] },
  x: { d: ['M6 6l12 12M18 6L6 18'] },
  chevron: { d: ['M9 6l6 6-6 6'] },
  chevronL: { d: ['M15 6l-6 6 6 6'] },
  plus: { d: ['M12 5v14M5 12h14'] },
  run: { d: ['M4 17l6-4-1-6 3 3 4 1M13 4.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM10 13l-3 7M11 12l4 3v6'] },
  dumbbell: { d: ['M2.5 12h3M18.5 12h3M8 8v8M16 8v8M5.5 9.5v5M18.5 9.5v5M8 12h8'] },
  calendar: { d: ['M3 10h18M8 3v4M16 3v4'], rects: [[3, 5, 18, 16, 2.5]] },
  message: { d: ['M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5z'] },
  user: { d: ['M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5'], circles: [[12, 8, 4]] },
  flag: { d: ['M5 21V4h11l-2 4 2 4H5'] },
  trend: { d: ['M3 17l6-6 4 4 8-8', 'M15 7h6v6'] },
};

export function Icon({
  name,
  size = 20,
  color,
  sw = 1.75,
}: {
  name: string;
  size?: number;
  color?: string;
  sw?: number;
}) {
  const t = useTheme();
  const def = PATHS[name];
  if (!def) return null;
  const stroke = color ?? t.ink2;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {(def.rects ?? []).map(([x, y, w, h, rx], i) => (
        <Rect key={`r${i}`} x={x} y={y} width={w} height={h} rx={rx} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {(def.circles ?? []).map(([cx, cy, r], i) => (
        <Circle key={`c${i}`} cx={cx} cy={cy} r={r} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {(def.d ?? []).map((d, i) => (
        <Path key={`p${i}`} d={d} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
