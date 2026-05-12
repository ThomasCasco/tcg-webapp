"use client";
import { useId, useMemo } from "react";

export interface SparklineProps {
  points?: number[];
  width?: number;
  height?: number;
  className?: string;
}

function generatePoints(): number[] {
  const out: number[] = [];
  let v = 50;
  for (let i = 0; i < 30; i++) {
    v += (Math.sin(i / 2) + Math.random() - 0.4) * 5;
    out.push(v);
  }
  return out;
}

export function Sparkline({ points, width = 280, height = 60, className }: SparklineProps) {
  const id = useId();
  const data = useMemo(() => points ?? generatePoints(), [points]);
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const path = data
    .map((p, i) => {
      const x = (i / Math.max(1, data.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className ?? "block w-full"}
      style={{ height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`sparkF-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${width},${height} L0,${height} Z`} fill={`url(#sparkF-${id})`} />
      <path d={path} fill="none" stroke="var(--accent-hi)" strokeWidth="2" />
    </svg>
  );
}
