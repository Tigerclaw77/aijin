"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../../utils/Supabase/supabaseClient";
import ProtectedRoute from "../../components/ProtectedRoute";
import useAuthStore from "../../store/authStore";
import useCompanionStore from "../../store/companionStore";
import { models } from "../../data/models";
import personalities from "../../data/personalities";
import { intimacyArchetypes } from "../../data/intimacy";

import MeterBar from "../../components/MeterBar";
import {
    getTotalGiftBonus,
    getGiftEffectList,
    getEffectiveLevel,
  } from "../../utils/Chat-Gifts/giftUtils";
import { getIntimacyRank } from "../../utils/Intimacy/intimacyRankEngine";

const UnlockButton = ({ type, onClick }) => {
  const label =
    type === "verbal" ? "Unlock Emotional Intimacy" : "Unlock Physical Intimacy";

  return (
    <button
      onClick={onClick}
      className="text-xs font-semibold text-yellow-400 hover:underline mt-1 flex items-center gap-1"
    >
      🔒 {label}
    </button>
  );
};

const ComingSoonModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow text-center">
      <h2 className="text-xl font-bold mb-2">Coming Soon!</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        This feature is under construction. Please check back later.
      </p>
      <button
        onClick={onClose}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        OK
      </button>
    </div>
  </div>
);

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { setCurrentCompanion } = useCompanionStore();

  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showVerbalUnlock, setShowVerbalUnlock] = useState(null);
  const [showPhysicalUnlock, setShowPhysicalUnlock] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    setDisplayName(user.profile?.display_name || user.email || "");

    const fetchCompanions = async () => {
      const { data: companions, error } = await supabase
        .from("companions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("soft_deleted", false)
        .eq("archived", false)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching companions:", error);
        setCompanions([]);
        setLoading(false);
        return;
      }

      const enriched = companions.map((comp) => {
        const modelData = models.find((m) => m.id === comp.model_id);
        const personalityData = personalities.find(
          (p) => p.id === comp.personality_id,
        );
        const archetypeData = intimacyArchetypes.find(
          (a) => a.name === comp.intimacy_archetype,
        );

        const giftList = getGiftEffectList(comp.gifts || []);
        const giftXPVerbal = getTotalGiftBonus(giftList, new Date(), "verbal");
        const giftXPPhysical = getTotalGiftBonus(giftList, new Date(), "physical");

        const effectiveVerbalLevel = getEffectiveLevel(comp.verbal_xp, giftXPVerbal);
        const effectivePhysicalLevel = getEffectiveLevel(comp.physical_xp, giftXPPhysical);


        return {
          ...comp,
          model_name: modelData?.name || "Unknown Model",
          avatar_image_url:
            modelData?.image || comp.avatar_image_url || "/default-avatar.png",
          name: comp.custom_name?.trim() || modelData?.name || "Unnamed",
          personality_label: personalityData?.label
            ? `${personalityData.label} (${personalityData.id})`
            : "Not set",
          intimacy_archetype: archetypeData?.name || "Not set",

          verbal_level: comp.verbal_level ?? 1,
          verbal_intimacy: comp.verbal_intimacy ?? 1,
          verbal_xp: comp.verbal_xp ?? 0,
          verbal_max_xp: 100,

          physical_level: comp.physical_level ?? 1,
          physical_intimacy: comp.physical_intimacy ?? 1,
          physical_xp: comp.physical_xp ?? 0,
          physical_max_xp: 100,

          relationship_level: comp.relationship_level ?? 1,
          relationship_xp: comp.relationship_xp ?? 0,
          relationship_max_xp: 100,

          giftList,
          giftXPVerbal,
          giftXPPhysical,
          effectiveVerbalLevel,
          effectivePhysicalLevel,
        };
      });

      const uniqueById = {};
      const deduped = enriched.filter((c) => {
        if (uniqueById[c.companion_id]) return false;
        uniqueById[c.companion_id] = true;
        return true;
      });

      const sorted = deduped.sort((a, b) => {
        const tierA = a.tier || 0;
        const tierB = b.tier || 0;
        const relA = a.relationshipMeter || 0;
        const relB = b.relationshipMeter || 0;
        return tierB - tierA || relB - relA;
      });

      setCompanions(sorted);
      setLoading(false);
    };

    fetchCompanions();
  }, [user]);

  const handleNameSave = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: nameInput })
      .eq("user_id", user.id);

    if (!error) {
      setDisplayName(nameInput);
      setEditName(false);
    }
  };

  if (!user?.id || loading) {
    return <div className="text-center py-10 text-white">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-4">
        <h2 className="text-xl font-bold mb-4">Folders</h2>
        <ul className="space-y-2">
          <li>
            <button className="hover:underline" onClick={() => setShowComingSoon(true)}>Favorites</button>
          </li>
          <li>
            <button className="hover:underline" onClick={() => setShowComingSoon(true)}>Sleeping Beauties</button>
          </li>
          <li>
            <button className="hover:underline" onClick={() => setShowComingSoon(true)}>Recent Break-ups</button>
          </li>
        </ul>
      </aside>

      <main className="flex-grow p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            {editName ? (
              <>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="text-xl font-bold text-black dark:text-white bg-white dark:bg-gray-700 rounded px-2 py-1"
                />
                <button
                  onClick={handleNameSave}
                  className="text-sm bg-green-600 text-white px-2 py-1 rounded"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {displayName}
                </h1>
                <button
                  onClick={() => {
                    setEditName(true);
                    setNameInput(displayName);
                  }}
                  className="text-blue-500 hover:underline text-sm"
                >
                  ✏️ Edit
                </button>
              </>
            )}
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => router.push("/create")}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
            >
              + Create New Companion
            </button>
            <button
              onClick={() => setShowComingSoon(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Account Settings
            </button>
            <button
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>

          {companions.length === 0 ? (
            <p className="text-gray-500">
              You haven’t created any companions yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {companions.map((companion) => (
                <div
                  key={companion.companion_id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  <img
                    src={companion.avatar_image_url || "/default-avatar.png"}
                    alt={companion.name}
                    className="w-full h-78 object-cover object-top rounded mb-3"
                  />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {companion.custom_name?.trim() || companion.model_name}
                  </h2>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Personality: {companion.personality_label}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Archetype: {companion.intimacy_archetype}
                  </p>

                  <MeterBar
                    label="Relationship"
                    icon="❤️"
                    companion_id={companion.companion_id}
                    type="relationship"
                    level={companion.relationship_level}
                    currentXP={companion.relationship_xp}
                    maxXP={companion.relationship_max_xp}
                    color="#10B981"
                  />

                  <MeterBar
                    label="Emotional Intimacy"
                    icon="🗣️"
                    companion_id={companion.companion_id}
                    type="verbal"
                    level={companion.verbal_level}
                    currentXP={companion.verbal_xp}
                    maxXP={companion.verbal_max_xp}
                    giftXP={companion.giftXPVerbal}
                    effectiveLevel={companion.effectiveVerbalLevel}
                    color="#6366F1"
                    locked={companion.verbal_intimacy === 1}
                  />

                  {companion.verbal_intimacy === 1 && (
                    <UnlockButton
                      type="verbal"
                      onClick={() => setShowVerbalUnlock(companion)}
                    />
                  )}

                  <MeterBar
                    label="Physical Intimacy"
                    icon="💞"
                    companion_id={companion.companion_id}
                    type="physical"
                    level={companion.physical_level}
                    currentXP={companion.physical_xp}
                    maxXP={companion.physical_max_xp}
                    giftXP={companion.giftXPPhysical}
                    effectiveLevel={companion.effectivePhysicalLevel}
                    color="#F472B6"
                    locked={companion.physical_intimacy === 1}
                  />

                  {companion.physical_intimacy === 1 && (
                    <UnlockButton
                      type="physical"
                      onClick={() => setShowPhysicalUnlock(companion)}
                    />
                  )}

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        setCurrentCompanion(companion);
                        router.push("/chat");
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setShowComingSoon(true)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="mt-2 text-right">
                    <button
                      onClick={() => setShowComingSoon(true)}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      📷 View Album
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showComingSoon && <ComingSoonModal onClose={() => setShowComingSoon(false)} />}
    </div>
  );
}
