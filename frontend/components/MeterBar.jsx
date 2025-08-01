export default function MeterBar({
  label,
  icon,
  level,
  currentXP,
  maxXP,
  color,
  locked,
}) {
  const progress = Math.min((currentXP / maxXP) * 100, 100);

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-sm font-semibold mb-1">
        <span>{icon} {label} (Lv. {level})</span>
        {locked && <span className="text-yellow-400">🔒</span>}
      </div>
      <div className="w-full bg-gray-300 dark:bg-gray-600 rounded h-3 overflow-hidden">
        <div
          className="h-3 rounded"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
