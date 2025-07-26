"use client";

import React from "react";
import PersonalityCard from "./PersonalityCard";

export default function PersonalitySelection({
  mbtiAxes,
  mbtiFilter,
  setMbtiFilter,
  selectedModel,
  filteredPersonalities,
  selectedPersonalityId,
  handlePersonalitySelect,
}) {
  return (
    <>
      <div className="flex flex-col lg:flex-row items-start gap-8 mb-8">
        <div className="w-full max-w-[700px] divide-y divide-white/10 border border-white/10 rounded-lg overflow-clip">
          {mbtiAxes.map(({ key, label, options }) => (
            <div
              key={key}
              className="flex items-center gap-4 px-4 py-3 bg-white/5"
            >
              <span className="w-32 font-medium">{label}</span>
              {options.map((opt) => (
                <label
                  key={opt.value}
                  className="w-36 flex items-center gap-1 text-sm"
                >
                  <input
                    type="radio"
                    name={key}
                    value={opt.value}
                    checked={mbtiFilter[key] === opt.value}
                    onChange={() =>
                      setMbtiFilter((prev) => ({
                        ...prev,
                        [key]: opt.value,
                      }))
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          ))}
        </div>

        {selectedModel && (
          <div className="flex flex-col items-center">
            <div className="h-48 w-48 rounded-lg overflow-hidden shadow-md">
              <img
                src={selectedModel.image}
                alt={selectedModel.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: "top" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {filteredPersonalities.map((p) => (
          <div key={p.id} className="relative z-0">
            <PersonalityCard
              name={p.name}
              tone={p.tone}
              behavior={p.behavior}
              mbti={p.mbti}
              sampleQuotes={p.sampleQuotes}
              isSelected={selectedPersonalityId === p.id}
              onClick={() => handlePersonalitySelect(p.id)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
