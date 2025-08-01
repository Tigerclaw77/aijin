'use client';

import Image from 'next/image';

export default function CharacterCard({
  name,
  description,
  image,
  onClick,
  isSelected,
  label = 'standard',
  className = '',
}) {
  const isPremium = label === 'premium';
  const isNiche = label === 'niche';

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl overflow-hidden border shadow-md transition-transform relative
        ${isSelected ? 'ring-2 ring-pink-500' : ''}
        ${isPremium
          ? 'bg-gradient-to-br from-[#3b0a48] via-[#111] to-[#1a002d] border-pink-400/50 shadow-pink-500/40 hover:shadow-pink-500/60'
          : 'bg-[#111] border-white/10'}
        hover:scale-[1.03] ${className}`}
    >
      {/* IMAGE */}
      <div className="relative w-full h-[600px]">
        <Image
          src={image}
          alt={name}
          layout="fill"
          objectFit="cover"
          objectPosition="top 20%"
          className="w-full h-full z-0"
        />
        <div className="absolute bottom-0 w-full h-28 z-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* TEXT */}
      <div className="absolute bottom-0 z-20 p-4 text-white">
        <h3 className={`text-lg font-semibold drop-shadow-md ${isPremium ? 'text-pink-300' : ''}`}>
          {name}
        </h3>
        <p className="text-sm text-gray-200 mt-1 drop-shadow-md">{description}</p>
      </div>

      {/* SELECTED TAG */}
      {isSelected && (
        <div className="absolute top-2 left-2 bg-pink-600 text-xs text-white px-2 py-1 rounded-md z-30">
          Selected
        </div>
      )}

      {/* PREMIUM RIBBON */}
      {isPremium && (
        <div className="absolute top-0 right-0 z-30">
          <div className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-bl-md shadow-md">
            Premium
          </div>
        </div>
      )}
    </div>
  );
}
