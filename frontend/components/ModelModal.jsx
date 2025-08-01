"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ModelModal({ model, onClose, getAssignments }) {
  const router = useRouter();
  const [assignments, setAssignments] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (model?.id) {
      setAssignments(getAssignments(model.id));
    }
  }, [model?.id, getAssignments]);

  if (!assignments) return null;

  const { intro, blog, tags } = assignments;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-lg"
          onClick={onClose}
        >
          ✕
        </button>
        <img
          src={model.image}
          alt={model.name}
          className="w-full h-144 object-cover rounded-lg mb-4"
        />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white text-center mb-2">
          {model.name}
        </h2>
        <p className="italic text-sm text-gray-600 dark:text-gray-300 mb-2">
          {intro}
        </p>
        <p
          className="text-[11px] text-pink-500 dark:text-pink-300 mt-1 cursor-pointer underline text-center mb-3"
          onClick={() => router.push(`/blogs/${blog.slug}`)}
        >
          {blog.title}
        </p>
        <div className="flex flex-wrap gap-1 justify-center">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="bg-pink-600 text-white px-2 py-0.5 rounded-full text-[10px]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
