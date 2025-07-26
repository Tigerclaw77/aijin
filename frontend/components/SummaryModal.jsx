"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { intimacyArchetypes } from "../data/intimacy";
import { saveCompanionDataToSupabase } from "../utils/saveCompanionData";

export default function SummaryModal({
  show,
  selectedModel,
  selectedModelId,
  selectedPersonalityId,
  selectedIntimacy,
  personalities,
  customName,
  setCustomName,
  setStoreCustomName,
  userId,
  setShow,
}) {
  const router = useRouter();

  if (!show) return null;

  const intimacyName =
    intimacyArchetypes.find(
      (a) =>
        a.verbal === selectedIntimacy?.verbal &&
        a.sexual === selectedIntimacy?.sexual
    )?.name || "Custom";

  const personalityName =
    personalities.find((p) => p.id === selectedPersonalityId)?.name || "";

  const handleSubmit = async () => {
    const result = await saveCompanionDataToSupabase({
      userId,
      customName,
      modelId: selectedModelId,
      personalityId: selectedPersonalityId,
      intimacyName,
    });

    if (!result.success) {
      alert("Failed to save: " + result.error);
      return;
    }

    setStoreCustomName(customName); // for initials use
    router.push("/chat");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="bg-gray-700 p-6 rounded shadow-md max-w-lg w-full relative text-center">
        <h2 className="text-2xl font-semibold mb-4">You're all set!</h2>

        <div className="flex justify-center gap-6 items-center mb-6">
          <img
            src={selectedModel.image}
            alt={selectedModel.name}
            className="w-24 rounded-full border-4 border-pink-400 shadow-md"
            style={{ objectPosition: "center 10%" }}
          />
        </div>

        <p className="mb-2">
          <strong>Model:</strong> {selectedModel?.name}
        </p>
        <p className="mb-2">
          <strong>Personality:</strong> {personalityName}
        </p>
        <p className="mb-4">
          <strong>Intimacy:</strong> {intimacyName}
        </p>

        <label className="block mb-4">
          <span className="text-sm text-gray-300">Name your companion:</span>
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Aya, Sakura, Mina"
            className="w-full p-2 border rounded mt-1"
          />
        </label>

        <div className="flex justify-end space-x-3">
          <button
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
          >
            Start with Her
          </button>
        </div>

        <button
          onClick={() => setShow(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
