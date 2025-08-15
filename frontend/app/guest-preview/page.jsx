"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { models } from "../../data/models";
import { supabase } from "../../utils/Supabase/supabaseClient";

import { standardTiers, elitePackages, haremTier } from "../../data/pricing";
import StandardTierCard from "../../components/StandardTierCard";
import EliteTierCard from "../../components/EliteTierCard";
import HaremTierCard from "../../components/HaremTierCard";

// NOTE: ModelModal + getModelAssignments removed on purpose (no big image popup)

/** Stable sort by name (then id) to avoid hydration jitter */
function stableSortByNameId(list) {
  return [...list].sort((a, b) => {
    const an = (a.name || "").toLowerCase();
    const bn = (b.name || "").toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    const ai = (a.id || "").toString();
    const bi = (b.id || "").toString();
    return ai < bi ? -1 : ai > bi ? 1 : 0;
  });
}

export default function GuestPreviewWithPricing() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState("guest"); // 'guest' | 'noCompanion' | 'hasCompanion'
  const [sampleModels, setSampleModels] = useState([]);

  // ---------------------------
  // Auth / status fetch
  // ---------------------------
  useEffect(() => {
    const fetchStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserStatus("guest");
        return;
      }

      const { data: companions, error } = await supabase
        .from("companions")
        .select("companion_id")
        .eq("user_id", user.id)
        .eq("is_deleted", false);

      if (error) {
        console.warn("Companions fetch warning:", error.message);
      }

      setUserStatus(
        !companions || companions.length === 0 ? "noCompanion" : "hasCompanion",
      );
    };

    fetchStatus();
  }, []);

  // ---------------------------
  // Build deterministic lineup:
  // - Exclude Rika (hostess)
  // - Exactly 1 premium (first by stable sort)
  // - 4 standard (first by stable sort)
  // - Order: [premium, ...standards]
  // ---------------------------
  const lineup = useMemo(() => {
    const available = models.filter((m) => m.name !== "Rika");

    const premiums = stableSortByNameId(
      available.filter((m) => m.label === "premium"),
    );
    const standards = stableSortByNameId(
      available.filter((m) => m.label !== "premium"),
    );

    const chosenPremium = premiums.length ? [premiums[0]] : [];
    const chosenStandards = standards.slice(0, 4);

    const merged = [...chosenPremium, ...chosenStandards];
    setSampleModels(merged);
    return merged;
  }, []);

  // ---------------------------
  // Routing handlers
  // ---------------------------
  function handleCreateWith(modelId) {
    const createUrl = `/create?model=${encodeURIComponent(modelId)}`;
    if (userStatus === "guest") {
      router.push(`/register?next=${encodeURIComponent(createUrl)}`);
    } else {
      // Both noCompanion and hasCompanion can create/select
      router.push(createUrl);
    }
  }

  function handleUnlockPremium(modelId) {
    // Route through your upgrade/paywall flow with context
    const subscribeUrl = `/subscribe?model=${encodeURIComponent(modelId)}`;
    if (userStatus === "guest") {
      router.push(`/register?next=${encodeURIComponent(subscribeUrl)}`);
    } else {
      router.push(subscribeUrl);
    }
  }

  function handleSubscribeClick(tierName) {
    if (tierName === "Free") {
      // Same behavior you had before
      router.push("/chat?guest=true");
    } else if (userStatus === "guest") {
      router.push("/register");
    } else if (userStatus === "noCompanion") {
      router.push("/create");
    } else {
      router.push("/subscribe");
    }
  }

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

      {/* Companion Card Preview (fan layout, no modal) */}
      <div className="flex justify-center items-end gap-4 mb-12 min-h-[22rem]">
        {sampleModels.length === 0 ? (
          <p className="text-gray-400">Loading models...</p>
        ) : (
          sampleModels.map((model, index) => {
            const rotation = (index - 2) * 8;
            const isPremium = model.label === "premium";

            const handleClick = () =>
              isPremium
                ? handleUnlockPremium(model.id)
                : handleCreateWith(model.id);

            return (
              <div
                key={model.id}
                className="transform transition duration-300 hover:scale-105 cursor-pointer relative"
                style={{ transform: `rotate(${rotation}deg)` }}
                onClick={handleClick}
                title={
                  isPremium
                    ? `Premium – Unlock ${model.name}`
                    : `Create with ${model.name}`
                }
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isPremium ? "Unlock to continue" : "Create with her"}
                </p>
              </div>
            );
          })
        )}
      </div>

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
