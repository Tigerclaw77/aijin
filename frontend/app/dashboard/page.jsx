"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";
import ProtectedRoute from "../../components/ProtectedRoute";
import useAuthStore from "../../store/authStore";
import useCompanionStore from "../../store/companionStore";
import { models } from "../../data/models";
import personalities from "../../data/personalities";
import { intimacyArchetypes } from "../../data/intimacy";
import MeterBar from "../../components/MeterBar";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  );
}

function DashboardInner() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { setSelectedCompanion } = useCompanionStore();

  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.profile?.display_name || user.email || "");

    useEffect(() => {
      console.log("🧠 Hydrated:", hasHydrated);
      console.log("👤 User:", user);
    }, [hasHydrated, user]);

    const fetchCompanions = async () => {
      const { data, error } = await supabase
        .from("companions")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching companions:", error);
        setCompanions([]);
        setLoading(false);
        return;
      }

      const enriched = data.map((comp) => {
        const modelData = models.find((m) => m.id === comp.model_id);
        const personalityData = personalities.find(
          (p) => p.id === comp.personality_id
        );
        const archetypeData = intimacyArchetypes.find(
          (a) => a.name === comp.intimacy_archetype
        );

        return {
          ...comp,
          model_name: modelData?.name || comp.model_id,
          personality_label: personalityData?.label || "Not set",
          intimacy_archetype: archetypeData?.name || "Not set",
        };
      });

      const sorted = enriched.sort((a, b) => {
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
      .eq("id", user.id);

    if (!error) {
      setDisplayName(nameInput);
      setEditName(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-4">
        <h2 className="text-xl font-bold mb-4">Folders</h2>
        <ul className="space-y-2">
          <li>
            <button className="hover:underline">Favorites</button>
          </li>
          <li>
            <button className="hover:underline">Sleeping Beauties</button>
          </li>
          <li>
            <button className="hover:underline">Recent Break-ups</button>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
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

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => router.push("/create")}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
            >
              + Create New Companion
            </button>
            <button
              onClick={() => router.push("/settings")}
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

          {/* Companion Cards */}
          {companions.length === 0 ? (
            <p className="text-gray-500">
              You haven’t created any companions yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {companions.map((companion) => (
                <div
                  key={companion.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  <img
                    src={companion.avatar_image_url || "/default-avatar.png"}
                    alt={companion.customName || companion.model_name}
                    className="w-full h-78 object-cover object-top rounded mb-3"
                  />

                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {companion.name?.trim() || companion.model_id}
                  </h2>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Personality:{" "}
                    {personalities.find(
                      (p) => p.id === companion.personality_id
                    )?.name || "Not set"}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Archetype:{" "}
                    {intimacyArchetypes.find(
                      (a) =>
                        a.name === companion.intimacy_archetype ||
                        a.name
                          .toLowerCase()
                          .includes(
                            companion.intimacy_archetype?.toLowerCase?.() || ""
                          )
                    )?.name || "Not set"}
                  </p>

                  <MeterBar
                    label="Relationship"
                    icon="❤️"
                    id={companion.id}
                    type="relationship"
                    level={1}
                    currentXP={companion.relationshipMeter || 70}
                    maxXP={100}
                    color="#10B981"
                  />

                  <MeterBar
                    label="Verbal Intimacy"
                    icon="🗣️"
                    id={companion.id}
                    type="verbal"
                    level={companion.verbal_level}
                    currentXP={companion.verbal_xp}
                    maxXP={companion.verbal_max_xp}
                    color="#6366F1"
                  />

                  <MeterBar
                    label="Physical Intimacy"
                    icon="🤍"
                    id={companion.id}
                    type="physical"
                    level={companion.physical_level}
                    currentXP={companion.physical_xp}
                    maxXP={companion.physical_max_xp}
                    color="#F472B6"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCompanion(companion);
                        router.push("/chat");
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCompanion(companion);
                        router.push("/edit");
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="mt-2 text-right">
                    <button
                      onClick={() => router.push(`/album/${companion.id}`)}
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
    </div>
  );
}
