"use client";

import { useRouter } from "next/navigation";
import useAuthStore from "../store/authStore";

const PREVIEW_QUERY = "/chat?preview=rika";
const CREATION_PATH = "/create"; // match ChatBox.jsx

export default function StandardTierCard({ tier, onClick }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isLoggedIn = !!user;
  const isFree = tier?.name === "Free";

  const handleClick = () => {
    if (isFree) {
      // Guest → preview; Logged-in → character creation
      router.push(isLoggedIn ? CREATION_PATH : PREVIEW_QUERY);
      return;
    }
    if (typeof onClick === "function") return onClick(tier);
    router.push("/subscribe");
  };

  const label = isFree ? (isLoggedIn ? "Create Your Character" : "Try for Free") : "Subscribe";

  return (
    <div
      key={tier.name}
      className={`relative w-56 h-[32rem] p-6 rounded-lg shadow-md border-2 transition transform text-left flex flex-col justify-between hover:scale-105 overflow-hidden group ${
        tier.highlight
          ? "border-pink-600 bg-pink-50 dark:bg-pink-900 text-pink-800 dark:text-pink-100 hover:shadow-lg"
          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
      }`}
      style={{ marginTop: "20px" }}
    >
      {tier.highlight && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.25 bg-pink-600 text-white text-xs px-3 py-1 rounded-full font-semibold z-10">
          Most Popular
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-2">{tier.name.replace(" 💍", "")}</h3>
        <p className="text-lg font-bold mb-2">{tier.price}</p>
        <ul className="text-sm space-y-1 mb-4">
          {tier.features.map((f, j) => (
            <li key={j}>• {f}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleClick}
        className={`w-full py-2 px-4 rounded font-semibold ${
          tier.highlight ? "bg-pink-600 text-white hover:bg-pink-700"
                         : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
      >
        {label}
      </button>

      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-white via-transparent to-white pointer-events-none transition duration-700 animate-shimmer" />
    </div>
  );
}
