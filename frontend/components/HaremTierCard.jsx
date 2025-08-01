'use client';

import { useRouter } from 'next/navigation';

export default function HaremTierCard({ haremTier }) {
  const router = useRouter();

  return (
    <div className="flex justify-center mt-4 mb-20">
      <div
        key={haremTier.name}
        className={`relative w-144 h-[24rem] p-6 rounded-lg border-2 ${haremTier.bgClass} flex flex-col justify-between transition transform hover:scale-105 shadow-[0_15px_40px_rgba(255,215,0,0.3)] hover:shadow-[0_20px_50px_rgba(255,215,0,0.5)]`}
      >
        <div
          className="text-yellow-500 text-center"
          style={{
            fontFamily: "'Great Vibes', cursive",
            fontSize: '4rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            marginBottom: '1.5rem',
          }}
        >
          {haremTier.name}
        </div>

        <div>
          <p className="text-xl font-bold mb-2">{haremTier.price}</p>
          <ul className="text-sm space-y-1 mb-4">
            {haremTier.features.map((f, j) => (
              <li key={j}>• {f}</li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => router.push('/register')}
            className="px-6 py-2 rounded-full font-semibold bg-black text-white shadow-[0_0_10px_2px_rgba(255,215,0,0.4)] transition-all duration-300 ease-in-out hover:shadow-[0_0_40px_10px_rgba(255,215,0,0.7)] hover:ring-4 hover:ring-yellow-400 hover:scale-105"
          >
            Inquire
          </button>
        </div>
      </div>
    </div>
  );
}
