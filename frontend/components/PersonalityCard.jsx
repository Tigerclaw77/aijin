// export default function PersonalityCard({ name, tone, behavior, mbti, sampleQuotes, onClick, isSelected }) {
//   return (
//     <div
//       onClick={onClick}
//       className={`cursor-pointer border rounded-xl p-4 shadow-sm hover:shadow-md transition space-y-2 ${
//         isSelected ? "border-blue-500 ring-2 ring-blue-400" : "border-gray-200"
//       }`}
//     >
//       <div className="flex items-center justify-between">
//         <h2 className="text-lg font-semibold">{name}</h2>
//         <span className="text-sm text-gray-500 font-mono">{mbti}</span>
//       </div>
//       <p className="text-sm text-gray-600 italic">{tone} — {behavior}</p>
//       <ul className="list-disc list-inside text-sm text-gray-700 pl-2 space-y-1">
//         {sampleQuotes.map((quote, i) => (
//           <li key={i}>"{quote}"</li>
//         ))}
//       </ul>
//       <button
//         className="mt-3 inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
//         type="button"
//       >
//         Preview Chat →
//       </button>
//     </div>
//   );
// }

import { useState } from "react";

const mbtiIcons = {
  INFJ: "🌿",
  ENFP: "🎉",
  INTJ: "🛡️",
  ISFP: "❤️",
  ESFP: "😎",
  INFP: "🌙",
  INTP: "📘",
  ISTP: "💨",
  ISFJ: "🧸",
  ENFJ: "✨",
  ENTP: "🔥",
  ENTJ: "📊",
  ESTP: "⚡",
  ESTJ: "🗂️",
  ESFJ: "🐾",
  ISTJ: "🧠"
};

export default function PersonalityCard({ name, tone, behavior, mbti, sampleQuotes = [], isSelected, onClick }) {
  const [showQuotes, setShowQuotes] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer border rounded-xl p-4 shadow-sm hover:shadow-md transition ${
        isSelected ? "border-blue-500 ring-2 ring-blue-400" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {mbtiIcons[mbti] && <span>{mbtiIcons[mbti]}</span>}
          {name} <span className="text-sm text-gray-500">({mbti})</span>
        </h2>
      </div>
      <p className="text-sm text-gray-600 mb-2">{tone} — {behavior}</p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowQuotes(!showQuotes);
        }}
        className="mb-2 px-3 py-1 border rounded text-sm bg-white hover:bg-gray-100"
      >
        {showQuotes ? "Hide Preview Chat" : "Preview Chat"}
      </button>

      {showQuotes && (
        <ul className="list-disc ml-4 text-sm text-gray-700">
          {sampleQuotes.map((q, i) => (
            <li key={i} className="mb-1">{q}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

