"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { models } from "../../data/models";
import { supabase } from "../../utils/Supabase/supabaseClient";
import { standardTiers, elitePackages, haremTier } from "../../data/pricing";
import StandardTierCard from "../../components/StandardTierCard";
import EliteTierCard from "../../components/EliteTierCard";
import HaremTierCard from "../../components/HaremTierCard";
import { getModelAssignments } from "../../utils/Companion/getModelAssignments";
import ModelModal from "../../components/ModelModal";

// Seeded deterministic shuffle
function shuffle(array, seed = 123) {
  let result = [...array];
  let random = mulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function GuestPreviewWithPricing() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState("guest");
  const [selectedModel, setSelectedModel] = useState(null);
  const [sampleModels, setSampleModels] = useState([]);

  // ✅ Handle model shuffle client-side to avoid hydration error
  useEffect(() => {
    const generateModels = () => {
      const availableModels = models.filter((m) => m.name !== "Rika");
      const premiumModels = availableModels.filter(
        (m) => m.label === "premium",
      );
      const standardModels = availableModels.filter(
        (m) => m.label !== "premium",
      );

      const seed = Math.floor(Math.random() * 100000);
      const shuffledStandard = shuffle(standardModels, seed);

      let chosenModels = [];

      if (premiumModels.length > 0) {
        const selectedPremium = shuffle(premiumModels, seed)[0];
        chosenModels = [selectedPremium, ...shuffledStandard.slice(0, 4)];
      } else {
        chosenModels = shuffledStandard.slice(0, 5);
      }

      const finalShuffle = shuffle(chosenModels, seed + 99); // final mix
      setSampleModels(finalShuffle);
    };

    generateModels();
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserStatus("guest");
        return;
      }

      const { data: companions } = await supabase
        .from("companions")
        .select("companion_id")
        .eq("user_id", user.id)
        .eq("is_deleted", false);

      setUserStatus(
        !companions || companions.length === 0 ? "noCompanion" : "hasCompanion",
      );
    };

    fetchStatus();
  }, []);

  const handleSubscribeClick = (tierName) => {
    if (tierName === "Free") {
      router.push("/chat?guest=true");
    } else if (userStatus === "guest") {
      router.push("/register");
    } else if (userStatus === "noCompanion") {
      router.push("/create");
    } else {
      router.push("/subscribe");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-10 px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
        Meet Your AI Companions
      </h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-10">
        Choose one companion to sample a limited conversation.{" "}
        <span
          onClick={() => router.push("/create")}
          className="text-blue-500 underline cursor-pointer hover:text-blue-400"
        >
          See all companions
        </span>
        .
      </p>

      {/* Companion Card Preview */}
      <div className="flex justify-center items-end gap-4 mb-12 min-h-[22rem]">
        {sampleModels.length === 0 ? (
          <p className="text-gray-400">Loading models...</p>
        ) : (
          sampleModels.map((model, index) => {
            const rotation = (index - 2) * 8;
            const isPremium = model.label === "premium";

            return (
              <div
                key={model.id}
                className="transform transition duration-300 hover:scale-105 cursor-pointer relative"
                style={{ transform: `rotate(${rotation}deg)` }}
                onClick={() => setSelectedModel(model)}
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-xs px-3 py-1 rounded-full font-semibold z-10 shadow-md">
                    Premium
                  </div>
                )}
                <img
                  src={model.image}
                  alt={model.name}
                  className={`w-48 h-80 object-cover rounded-xl shadow-lg border-4 ${
                    isPremium ? "border-yellow-400" : "border-pink-500"
                  } bg-white`}
                />
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 font-medium text-center">
                  {model.name}
                </p>
              </div>
            );
          })
        )}
      </div>

      {selectedModel && (
        <ModelModal
          model={selectedModel}
          onClose={() => setSelectedModel(null)}
          getAssignments={getModelAssignments}
        />
      )}

      {/* Standard Pricing */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Standard Packages
      </h2>
      <div className="flex justify-center gap-4 flex-nowrap overflow-x-auto px-2 mb-12 h-[36rem]">
        {standardTiers.map((tier) => (
          <StandardTierCard
            key={tier.name}
            tier={tier}
            onClick={() => handleSubscribeClick(tier.name)}
          />
        ))}
      </div>

      {/* Elite Packages */}
      <h2 className="text-2xl font-bold text-white mb-4 mt-6">Elite Access</h2>
      <div className="flex justify-center gap-4 flex-nowrap overflow-x-auto px-2 pb-10">
        {elitePackages.map((pkg) => (
          <EliteTierCard key={pkg.name} pkg={pkg} />
        ))}
      </div>

      {/* Harem Tier */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-1 mb-6">
        Harem Tier
      </h2>
      <HaremTierCard haremTier={haremTier} />
    </main>
  );
}
