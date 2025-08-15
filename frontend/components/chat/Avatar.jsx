"use client";

import { memo, useEffect, useState } from "react";

const Avatar = memo(function Avatar({ src, letter = "R" }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setErr(false);
  }, [src]);

  const showImage = !!src && !err;

  return (
    <div className="w-8 h-8 mr-2 rounded-full overflow-hidden border border-pink-500 shadow-sm grid place-items-center bg-pink-600/30">
      {showImage ? (
        <img
          src={src}
          alt="AI"
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{
            objectPosition: "center -20%",
            transform: "scale(1.3)",
            opacity: loaded ? 1 : 0,
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
        />
      ) : (
        <span className="text-[10px] font-bold text-pink-200">
          {String(letter).slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
});

export default Avatar;
