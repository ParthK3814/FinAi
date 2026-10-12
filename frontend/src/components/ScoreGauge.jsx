import { useEffect, useState } from "react";

export const GRADE_COLORS = {
  Strong: "#23845A",
  Stable: "#0E7C86",
  Developing: "#B97A0C",
  "At risk": "#BF4036",
};

const SIZE = 220;
const RADIUS = 90;
const STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC = CIRCUMFERENCE * 0.75; // a 270 degree dial, open at the bottom

export default function ScoreGauge({ score, grade, size = SIZE }) {
  // Start empty, then fill on the next frame so the dial animates once on load.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color = GRADE_COLORS[grade] || "#0E7C86";
  const filled = ARC * (Math.max(0, Math.min(100, shown)) / 100);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={size}
        height={size}
        role="img"
        aria-label={`Financial Logic Score ${score} out of 100, ${grade}`}
      >
        <g transform={`rotate(135 ${SIZE / 2} ${SIZE / 2})`} fill="none" strokeLinecap="round" strokeWidth={STROKE}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="#E3EAEE" style={{ strokeDasharray: `${ARC} ${CIRCUMFERENCE}` }} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={color}
            style={{ strokeDasharray: `${filled} ${CIRCUMFERENCE}`, transition: "stroke-dasharray 900ms ease-out" }}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-3">
        <span className="font-display text-6xl font-bold leading-none tracking-tight">{score}</span>
        <span className="mt-1 text-sm text-ink-500">out of 100</span>
        <span className="mt-2 rounded-full px-3 py-0.5 text-sm font-bold text-white" style={{ background: color }}>
          {grade}
        </span>
      </div>
    </div>
  );
}
