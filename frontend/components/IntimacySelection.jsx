"use client";

import React from "react";
import { intimacyArchetypes } from "../data/intimacy";

export default function IntimacySelection({
  selectedIntimacy,
  setSelectedIntimacy,
  setShowSummaryModal,
}) {
  return (
    <div className="flex flex-col gap-10 mb-10">
      {/* Verbal Intimacy */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Verbal Intimacy</h2>
        <div className="relative h-12 flex items-center">
          <div className="absolute left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-yellow-400 to-red-500 rounded" />
          {[1, 2, 3, 4, 5].map((val) => (
            <label
              key={`verbal-${val}`}
              className="flex-1 text-center relative cursor-pointer"
            >
              <input
                type="radio"
                name="verbal"
                value={val}
                checked={selectedIntimacy?.verbal === val}
                onChange={() => {
                  setSelectedIntimacy({ ...selectedIntimacy, verbal: val });
                }}
                className="peer hidden"
              />
              <div
                className={`h-6 w-6 mx-auto rounded-full border-2 border-white bg-white
                ${selectedIntimacy?.verbal === val ? "scale-150 bg-pink-500" : "scale-100"}`}
              />
            </label>
          ))}
        </div>
        <div className="text-center mt-2 text-white/80">
          {selectedIntimacy?.verbal
            ? ["Cold", "Reserved", "Warm", "Affectionate", "Passionate"][selectedIntimacy.verbal - 1]
            : "Choose a level"}
        </div>
      </div>

      {/* Sexual Intimacy */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Sexual Intimacy</h2>
        <div className="relative h-12 flex items-center">
          <div className="absolute left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-yellow-400 to-red-500 rounded" />
          {[1, 2, 3, 4, 5].map((val) => (
            <label
              key={`sexual-${val}`}
              className="flex-1 text-center relative cursor-pointer"
            >
              <input
                type="radio"
                name="sexual"
                value={val}
                checked={selectedIntimacy?.sexual === val}
                onChange={() => {
                  setSelectedIntimacy({ ...selectedIntimacy, sexual: val });
                }}
                className="peer hidden"
              />
              <div
                className={`h-6 w-6 mx-auto rounded-full border-2 border-white bg-white
                ${selectedIntimacy?.sexual === val ? "scale-150 bg-pink-500" : "scale-100"}`}
              />
            </label>
          ))}
        </div>
        <div className="text-center mt-2 text-white/80">
          {selectedIntimacy?.sexual
            ? ["Cold", "Shy", "Curious", "Bold", "Intense"][selectedIntimacy.sexual - 1]
            : "Choose a level"}
        </div>
      </div>

      {/* Level 1 Warning */}
      {(selectedIntimacy?.verbal === 1 || selectedIntimacy?.sexual === 1) && (
        <div className="text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 p-4 rounded mb-6 text-sm">
          Choosing level 1 may limit emotional or NSFW interactions unless
          overridden with future gifts or story events.
        </div>
      )}

      {/* Archetype */}
      {selectedIntimacy?.verbal && selectedIntimacy?.sexual && (
        <div className="text-center text-lg mb-4">
          <span className="font-semibold">Archetype: </span>
          {
            intimacyArchetypes.find(
              (a) =>
                a.verbal === selectedIntimacy.verbal &&
                a.sexual === selectedIntimacy.sexual
            )?.name || "Custom"
          }
        </div>
      )}

      {/* Submit */}
<div className="mt-6 text-center">
  <button
    onClick={() => setShowSummaryModal(true)}
    className={`px-6 py-2 rounded ${
      selectedIntimacy?.verbal && selectedIntimacy?.sexual
        ? "bg-pink-600 hover:bg-pink-700 text-white"
        : "bg-gray-600 text-gray-300 cursor-not-allowed"
    }`}
    disabled={!selectedIntimacy?.verbal || !selectedIntimacy?.sexual}
  >
    Continue
  </button>
</div>

    </div>
  );
}
