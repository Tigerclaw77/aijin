import { useState } from "react";

export default function CharacterCard({ name, description, image, onClick, isSelected, sampleQuotes, showAskField }) {
  const [mockInput, setMockInput] = useState("");
  const [mockResponse, setMockResponse] = useState("");

  const handleMockAsk = () => {
    if (!mockInput.trim()) return;
    setMockResponse(`"${name}" might say: “Hmm… ${mockInput}? That’s an interesting one.”`);
  };

  return (
    <div
      onClick={!showAskField ? onClick : undefined}
      className={`cursor-pointer border rounded-xl p-4 shadow-sm hover:shadow-md transition ${
        isSelected ? "border-blue-500 ring-2 ring-blue-400" : "border-gray-200"
      }`}
    >
      {image && (
        <img
          src={image}
          alt={name}
          className="w-full h-124 object-cover rounded-md mb-3"
        />
      )}

      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="text-sm text-gray-600 mb-2">{description}</p>

      {sampleQuotes && (
        <ul className="text-sm text-gray-500 space-y-1 mb-3">
          {sampleQuotes.map((quote, idx) => (
            <li key={idx}>“{quote}”</li>
          ))}
        </ul>
      )}

      {showAskField && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            placeholder="Ask a question..."
            className="w-full border px-3 py-1 rounded text-sm"
            value={mockInput}
            onChange={(e) => setMockInput(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            onClick={handleMockAsk}
          >
            Preview Answer
          </button>
          {mockResponse && (
            <p className="text-xs text-gray-600 italic mt-1">{mockResponse}</p>
          )}
        </div>
      )}
    </div>
  );
}
