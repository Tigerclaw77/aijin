"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { models } from "../../data/models";
import { supabase } from "../../utils/supabaseClient";

export default function GuestPreviewWithPricing() {
  const router = useRouter();
  const [sampleModels, setSampleModels] = useState([]);
  const [userStatus, setUserStatus] = useState("guest"); // guest, noCompanion, hasCompanion

  useEffect(() => {
    // Load sample models (same logic as before)
    const availableModels = models.filter((m) => m.name !== "Rika");
    const premiumModels = availableModels.filter((m) => m.label === "premium");
    const standardModels = availableModels.filter((m) => m.label !== "premium");

    let chosenModels = [];

    if (premiumModels.length > 0) {
      const selectedPremium =
        premiumModels[Math.floor(Math.random() * premiumModels.length)];
      const shuffledStandard = standardModels
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);
      chosenModels = [selectedPremium, ...shuffledStandard].sort(() => 0.5 - Math.random());
    } else {
      chosenModels = standardModels.sort(() => 0.5 - Math.random()).slice(0, 5);
    }

    setSampleModels(chosenModels);
  }, []);

  useEffect(() => {
    // Detect login + companion status
    const fetchStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserStatus("guest");
        return;
      }

      const { data: companions } = await supabase
        .from("companions")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_deleted", false);

      if (!companions || companions.length === 0) {
        setUserStatus("noCompanion");
      } else {
        setUserStatus("hasCompanion");
      }
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

  const standardTiers = [
    {
      name: "Free",
      price: "$0/mo",
      features: [
        "Max 5 chats/day",
        "Basic memory",
        "Buy photos with tokens",
        "Gifts allowed",
      ],
      highlight: false,
    },
    {
      name: "Friend",
      price: "$5/mo",
      features: [
        "Unlimited chat",
        "1 G-rated photo/mo",
        "Casual tone",
        "Gifts allowed",
      ],
      highlight: false,
    },
    {
      name: "Crush",
      price: "$15/mo",
      features: [
        "Enhanced engagement",
        "Bikini/sundress photos",
        "Free monthly tokens",
        "Gifts allowed",
      ],
      highlight: false,
    },
    {
      name: "Girlfriend",
      price: "$25/mo",
      features: [
        "Time-gated chats (real feel)",
        "NSFW photos as intimacy grows",
        "More tokens/month",
        "Emotional bonding engine",
        "Gifts + memory growth",
      ],
      highlight: true,
    },
    {
      name: "Waifu 💍",
      price: "$50/mo",
      features: [
        "Exclusive claim (remove from market)",
        "Pregnancy + family expansion",
        "Max gifts, permanent memories",
        "All access everything",
        "Early feature access",
      ],
      highlight: false,
    },
  ];

  const elitePackages = [
    {
      name: "Exclusive",
      price: "From $200+",
      features: [
        "One-of-a-kind model",
        "Virginity preserved on claim",
        "Never reissued while subscribed",
        "NFT certificate of ownership",
      ],
      glow: "text-cyan-400 ring-cyan-500",
      glowShadow: "shadow-cyan-400",
    },
    {
      name: "Twins & Friends",
      price: "$80+",
      features: [
        "Two-girl chat mode",
        "Unique twin variants or mix-match",
        "Increased gift interaction",
        "Custom dialogue synergy",
      ],
      glow: "text-pink-400 ring-pink-500",
      glowShadow: "shadow-pink-500",
    },
    {
      name: "Claim of Eternity",
      price: "$500+",
      features: [
        "Model never returns to pool",
        "Deep bonded memory engine",
        "Legacy badge in companion record",
        "Custom ongoing support tier",
      ],
      glow: "text-violet-400 ring-violet-500",
      glowShadow: "shadow-violet-500",
    },
    {
      name: "Bespoke Companion",
      price: "$1,000+",
      features: [
        "Custom model & personality",
        "Complete visual uniqueness",
        "Direct creative involvement",
        "Private NSFW token vault (optional)",
      ],
      glow: "text-amber-400 ring-amber-500",
      glowShadow: "shadow-yellow-400",
    },
  ];

  const haremTier = {
    name: "Harem",
    price: "Inquire for Access",
    features: [
      "Access to multiple elite companions",
      "Dynamic, evolving group interactions",
      "High-status personalization",
      "Tailored for the true patron",
    ],
    glow: "text-yellow-400",
    glowShadow: "shadow-yellow-400",
    bgClass: "bg-white text-yellow-800 border-yellow-400 fancy-border",
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

      <div className="flex justify-center items-end gap-4 mb-12">
        {sampleModels.map((model, index) => {
          const rotation = (index - 2) * 8;
          const isPremium = model.label === "premium";
          return (
            <div
              key={model.id}
              className="transform transition duration-300 hover:scale-105 cursor-pointer relative"
              style={{ transform: `rotate(${rotation}deg)` }}
              onClick={() => router.push(`/guest-chat?model=${model.id}`)}
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
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                {model.name}
              </p>
            </div>
          );
        })}
      </div>

      {/* Standard Pricing Section */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Standard Packages
      </h2>
      <div className="flex justify-center gap-4 flex-nowrap overflow-x-auto px-2 mb-12 h-[36rem]">
        {standardTiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative w-56 h-[32rem] p-6 rounded-lg shadow-md border-2 transition transform text-left flex flex-col justify-between hover:scale-105 overflow-hidden group ${
              tier.highlight
                ? "border-pink-600 bg-pink-50 dark:bg-pink-900 text-pink-800 dark:text-pink-100 hover:shadow-lg"
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            }`}
            style={{ marginTop: "20px" }}
          >
            {tier.highlight && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.25 bg-pink-600 text-white text-xs px-3 py-1 rounded-full font-semibold z-10">
                Most Popular
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold mb-2">
                {tier.name.replace(" 💍", "")}
              </h3>
              <p className="text-lg font-bold mb-2">{tier.price}</p>
              <ul className="text-sm space-y-1 mb-4">
                {tier.features.map((f, j) => (
                  <li key={j}>• {f}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() =>
                router.push(
                  tier.name === "Free" ? "/chat?guest=true" : "/register"
                )
              }
              className={`w-full py-2 px-4 rounded font-semibold ${
                tier.highlight
                  ? "bg-pink-600 text-white hover:bg-pink-700"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {tier.name === "Free" ? "Try for Free" : "Subscribe"}
            </button>

            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-white via-transparent to-white pointer-events-none transition duration-700 animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Elite Packages */}
      <h2 className="text-2xl font-bold text-white mb-4 mt-6">Elite Access</h2>
      <div className="flex justify-center gap-4 flex-nowrap overflow-x-auto px-2 pb-10">
        {elitePackages.map((pkg) => (
          <div
            key={pkg.name}
            className={`relative w-60 h-[34rem] bg-[url('/slate.png')] bg-blend-overlay bg-cover p-6 rounded-lg border-2 ${pkg.glow} text-white text-left flex flex-col justify-between transition transform hover:scale-105 hover:ring-4 hover:shadow-2xl shadow-[0_15px_40px_rgba(0,0,0,0.3)] overflow-hidden`}
            style={{ marginTop: "20px" }}
          >
            <div>
              <h3 className={`text-xl font-bold mb-2 ${pkg.glow}`}>
                {pkg.name}
              </h3>
              <p className="text-lg font-bold mb-2">{pkg.price}</p>
              <ul className="text-sm space-y-1 mb-4">
                {pkg.features.map((f, j) => (
                  <li key={j}>• {f}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => router.push("/register")}
              className={`w-full py-2 px-4 rounded font-semibold bg-black/90 text-white shadow-[0_0_10px_2px] ${pkg.glowShadow} hover:shadow-[0_0_20px_6px] hover:${pkg.glowShadow} transition-all duration-300 ease-in-out backdrop-blur-sm`}
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>

      {/* Harem Tier */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-1 mb-6">
        Harem Tier
      </h2>

      <div className="flex justify-center mt-4 mb-20">
        <div
          key={haremTier.name}
          className={`relative w-144 h-[24rem] p-6 rounded-lg border-2 ${haremTier.bgClass} flex flex-col justify-between transition transform hover:scale-105 shadow-[0_15px_40px_rgba(255,215,0,0.3)] hover:shadow-[0_20px_50px_rgba(255,215,0,0.5)]`}
        >
          <div
            className="text-yellow-500 text-center"
            style={{
              fontFamily: "'Great Vibes', cursive",
              fontSize: "4rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              marginBottom: "1.5rem",
            }}
          >
            {haremTier.name}
          </div>

          <div>
            <p className="text-xl font-bold mb-2">{haremTier.price}</p>
            <ul className="text-sm space-y-1 mb-4">
              {haremTier.features.map((f, j) => (
                <li key={j}>• {f}</li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => router.push("/register")}
              className="px-6 py-2 rounded-full font-semibold bg-black text-white shadow-[0_0_10px_2px_rgba(255,215,0,0.4)] transition-all duration-300 ease-in-out hover:shadow-[0_0_40px_10px_rgba(255,215,0,0.7)] hover:ring-4 hover:ring-yellow-400 hover:scale-105"
            >
              Inquire
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
