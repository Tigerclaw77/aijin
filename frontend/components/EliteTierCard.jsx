'use client';

import { useRouter } from 'next/navigation';

export default function EliteTierCard({ pkg }) {
  const router = useRouter();

  return (
    <div
      key={pkg.name}
      className={`relative w-60 h-[34rem] bg-[url('/slate.png')] bg-blend-overlay bg-cover p-6 rounded-lg border-2 ${pkg.glow} text-white text-left flex flex-col justify-between transition transform hover:scale-105 hover:ring-4 hover:shadow-2xl shadow-[0_15px_40px_rgba(0,0,0,0.3)] overflow-hidden`}
      style={{ marginTop: '20px' }}
    >
      <div>
        <h3 className={`text-xl font-bold mb-2 ${pkg.glow}`}>{pkg.name}</h3>
        <p className="text-lg font-bold mb-2">{pkg.price}</p>
        <ul className="text-sm space-y-1 mb-4">
          {pkg.features.map((f, j) => (
            <li key={j}>• {f}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => router.push('/register')}
        className={`w-full py-2 px-4 rounded font-semibold bg-black/90 text-white shadow-[0_0_10px_2px] ${pkg.glowShadow} hover:shadow-[0_0_20px_6px] hover:${pkg.glowShadow} transition-all duration-300 ease-in-out backdrop-blur-sm`}
      >
        Subscribe
      </button>
    </div>
  );
}
