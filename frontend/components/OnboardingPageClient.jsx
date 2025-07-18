"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CharacterCard from "./CharacterCard";
import PersonalityCard from "../components/PersonalityCard";

export default function OnboardingPageClient() {
  const router = useRouter();
  const [models, setModels] = useState([]);
  const [personalities, setPersonalities] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [selectedPersonalityId, setSelectedPersonalityId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const modelModule = await import("../data/models");
      const personalityModule = await import("../data/personalities");
      setModels(modelModule.models);
      setPersonalities(personalityModule.personalities);
    };
    loadData();
  }, []);

  const handleModelSelect = (id) => {
    setSelectedModelId(id);
  };

  const handlePersonalitySelect = (id) => {
    setSelectedPersonalityId(id);
    localStorage.setItem("companionId", selectedModelId);
    localStorage.setItem("personalityId", id);
    router.push("/chat");
  };

  const selectedModel = models.find((m) => m.id === selectedModelId);

  return (
    <main className="min-h-screen p-8 bg-white text-gray-800">
      {selectedModelId && (
        <button
          onClick={() => setSelectedModelId(null)}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back to model selection
        </button>
      )}

      <h1 className="text-2xl font-bold mb-4">
        {selectedModelId
          ? `Choose a personality for ${selectedModel?.name}`
          : "Choose Your AI Companion"}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {!selectedModelId
          ? models.map((model) => (
              <CharacterCard
                key={model.id}
                name={model.name}
                description={model.description}
                image={model.image}
                onClick={() => handleModelSelect(model.id)}
                isSelected={selectedModelId === model.id}
              />
            ))
          : personalities.map((p) => (
              <PersonalityCard
                key={p.id}
                name={p.name}
                tone={p.tone}
                behavior={p.behavior}
                mbti={p.mbti}
                sampleQuotes={p.sampleQuotes}
                onClick={() => handlePersonalitySelect(p.id)}
                isSelected={selectedPersonalityId === p.id}
              />
            ))}
      </div>
    </main>
  );
}
