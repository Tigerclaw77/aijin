export default function MeterBar({
  label,
  icon,
  level,
  currentXP,
  maxXP,
  giftXP = 0,
  effectiveLevel = level,
  color,
  locked,
}) {
  const baseProgress = Math.min((currentXP / maxXP) * 100, 100);
  const totalXP = currentXP + giftXP;
  const effectiveProgress = Math.min((totalXP / maxXP) * 100, 100);

  const isBoosted = effectiveLevel > level;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-sm font-semibold mb-1">
        <span>
          {icon} {label} (Lv.{" "}
          <span
            className={`${
              isBoosted ? "text-blue-400 drop-shadow-md animate-pulse" : ""
            }`}
            title={isBoosted ? "Boosted by gift" : ""}
          >
            {effectiveLevel.toFixed(1)}
          </span>
          )
        </span>
        {locked && <span className="text-yellow-400">🔒</span>}
      </div>

      <div className="w-full bg-gray-300 dark:bg-gray-600 rounded h-3 overflow-hidden relative">
        {/* Base XP */}
        <div
          className="h-3 rounded absolute left-0 top-0"
          style={{
            width: `${baseProgress}%`,
            backgroundColor: color,
            opacity: 0.8,
          }}
        />

        {/* Boost overlay */}
        {isBoosted && (
          <div
            className="h-3 rounded absolute left-0 top-0 bg-blue-400 animate-pulse"
            style={{
              width: `${effectiveProgress}%`,
              opacity: 0.6,
              mixBlendMode: "screen",
            }}
          />
        )}
      </div>
    </div>
  );
}
