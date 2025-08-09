export default function UnlockButton({ type, onClick }) {
  const label =
    type === "verbal" ? "Unlock Emotional Intimacy" : "Unlock Physical Intimacy";

  return (
    <button
      onClick={onClick}
      className="text-xs font-semibold text-yellow-400 hover:underline mt-1 flex items-center gap-1"
    >
      🔒 {label}
    </button>
  );
}
