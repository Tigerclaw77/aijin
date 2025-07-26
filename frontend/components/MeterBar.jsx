// components/MeterBar.jsx (with level-aware XP fill + pulse on XP gain)

import { useEffect, useState } from "react";

export default function MeterBar({
  label,
  icon,
  level = 1,
  currentXP = 0,
  maxXP = 100,
  color = "#3B82F6",
  id = "",
  type = "", // 'verbal' | 'physical' | 'relationship'
}) {
  const rawPercent = (currentXP / maxXP) * 100;
  const percent = Math.min(100, rawPercent);
  const isEmpty = currentXP <= 0;
  const hasProgress = percent > 0 && percent < 100;

  const localStorageKey = `lastXP_${id}_${type}`;
  const [animatePulse, setAnimatePulse] = useState(false);

  useEffect(() => {
    const lastXP = parseInt(localStorage.getItem(localStorageKey), 10) || 0;
    if (currentXP > lastXP) {
      setAnimatePulse(true);
      setTimeout(() => setAnimatePulse(false), 1000);
    }
    localStorage.setItem(localStorageKey, currentXP.toString());
  }, [currentXP, localStorageKey]);

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
        <span>
          {icon && <span className="mr-1">{icon}</span>}
          {label} (Lv. {level})
        </span>
        <span>{Math.floor(percent)}%</span>
      </div>

      <div className="relative w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        {/* Faded fill for remainder if level > 1 */}
        {level > 1 && hasProgress && (
          <div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              width: "100%",
              backgroundColor: color,
              opacity: 0.15,
            }}
          />
        )}

        {/* Active XP fill */}
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-300 rounded-full ${
            animatePulse ? "animate-pulseOnce" : ""
          }`}
          style={{
            width: isEmpty ? "4px" : `${percent}%`,
            backgroundColor: color,
            opacity: isEmpty ? 0.3 : 1,
          }}
        />
      </div>
    </div>
  );
}
