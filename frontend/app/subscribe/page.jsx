"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import useCompanionStore from "../../store/companionStore";
import { models } from "../../data/models";
import { standardTiers, elitePackages, haremTier } from "../../data/pricing";

/**
 * Lightweight capabilities map:
 * - Each subscription "covers" only 1 companion
 * - Premium avatars require a premium-eligible plan (usually elite/harem)
 * If your pricing objects in ../../data/pricing already contain `premiumAllowed`,
 * we’ll use that; otherwise we infer sensible defaults.
 */
function inferPlanMeta(item, kind) {
  const base = {
    id: (item?.id || item?.name || "").toString().toLowerCase().replace(/\s+/g, "_"),
    name: item?.name || "",
    price: item?.price || "",
    // fallback rules: Standard=false, Elite/Harem=true — override if provided
    premiumAllowed:
      typeof item?.premiumAllowed === "boolean"
        ? item.premiumAllowed
        : kind === "elite" || kind === "harem",
    kind,
  };
  return base;
}

export default function SubscribePage() {
  const router = useRouter();
  const sp = useSearchParams();

  // model context: store first, fallback to query (?model=id)
  const { selectedAvatar } = useCompanionStore();
  const queryModelId = sp.get("model");
  const modelFromQuery = useMemo(
    () => models.find((m) => m.id === queryModelId),
    [queryModelId]
  );
  const avatar = selectedAvatar || modelFromQuery || null;
  const isPremiumAvatar = !!avatar && (avatar.label === "premium" || avatar.isPremium);

  // flatten plans with inferred meta
  const standardPlans = useMemo(
    () => standardTiers.map((t) => ({ ...inferPlanMeta(t, "standard"), raw: t })),
    []
  );
  const elitePlans = useMemo(
    () => elitePackages.map((t) => ({ ...inferPlanMeta(t, "elite"), raw: t })),
    []
  );
  const haremPlan = useMemo(
    () => ({ ...inferPlanMeta(haremTier, "harem"), raw: haremTier }),
    []
  );

  // selected plan
  const [selected, setSelected] = useState(null);
  // show a gating banner if avatar is premium and selection isn't eligible
  const selectionBlocksPremium =
    isPremiumAvatar && selected && !selected.premiumAllowed;

  // Stripe checkout
  async function startCheckout() {
    if (!selected) return;

    // Free flows to guest chat (kept from your original UX)
    if (selected.name?.toLowerCase() === "free") {
      router.push("/chat?guest=true");
      return;
    }

    if (selectionBlocksPremium) {
      alert(
        `${avatar?.name || "This premium companion"} requires a premium-eligible plan. Please pick an Elite/Harem plan.`
      );
      return;
    }

    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selected.id,            // your API should map plan id -> Stripe price id
          modelId: avatar?.id || "",    // so webhook can auto-assign this companion
        }),
      });

      if (res.status === 401) {
        // Not logged in → go register but preserve intent
        const next = `/subscribe${avatar ? `?model=${encodeURIComponent(avatar.id)}` : ""}`;
        router.push(`/register?next=${encodeURIComponent(next)}`);
        return;
      }

      const { url, error } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        alert(error || "Problem starting checkout.");
      }
    } catch (e) {
      console.error("checkout error", e);
      alert("Could not start checkout. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-10 px-4 text-center">
      {/* Avatar context (optional) */}
      {avatar && (
        <div className="flex justify-center items-center flex-col mb-6">
          <img
            src={avatar.image}
            alt={avatar.name}
            className="w-48 h-72 object-cover rounded-xl shadow-lg border-4 border-pink-500 bg-white"
          />
          <p className="mt-2 text-lg font-semibold text-gray-800 dark:text-white">
            {avatar.name}
            {isPremiumAvatar && (
              <span className="ml-2 text-xs font-semibold uppercase text-fuchsia-600 bg-fuchsia-100 dark:bg-fuchsia-900/40 dark:text-fuchsia-300 px-2 py-0.5 rounded-full align-middle">
                Premium
              </span>
            )}
          </p>
        </div>
      )}

      {/* Premium gating banner */}
      {isPremiumAvatar && (
        <div className="max-w-3xl mx-auto mb-6 px-4 py-3 rounded-xl ring-1 ring-fuchsia-500/40 bg-fuchsia-600/15 text-fuchsia-100 text-sm">
          Unlock <b>{avatar.name}</b> with a premium‑eligible plan.
          {selected && !selected.premiumAllowed && (
            <span className="ml-2 text-fuchsia-200/90">
              (Your current selection isn’t eligible.)
            </span>
          )}
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
        Choose Your Subscription
      </h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-10">
        Your companion is waiting — unlock her full attention with a plan that fits your desires.
      </p>

      {/* Standard Packages */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Standard Packages
      </h2>
      <div className="flex justify-center gap-4 flex-nowrap overflow-x-auto px-2 mb-12 h-[36rem]">
        {standardPlans.map((tier) => {
          const isSelected = selected?.id === tier.id;
          const gated = isPremiumAvatar && !tier.premiumAllowed;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelected(tier)}
              className={`relative w-56 h-[32rem] p-6 rounded-lg shadow-md border-2 transition transform text-left flex flex-col justify-between hover:scale-105 overflow-hidden group ${
                tier.raw.highlight
                  ? "border-pink-600 bg-pink-50 dark:bg-pink-900 text-pink-800 dark:text-pink-100 hover:shadow-lg"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              } ${isSelected ? "ring-2 ring-pink-500" : ""}`}
              style={{ marginTop: "20px" }}
            >
              {tier.raw.highlight && (
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
                  {tier.raw.features.map((f, j) => (
                    <li key={j}>• {f}</li>
                  ))}
                </ul>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Covers <b>1 companion</b>
                  {gated && (
                    <span className="ml-1 text-fuchsia-600 dark:text-fuchsia-300">
                      • Not eligible for Premium avatars
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-white via-transparent to-white pointer-events-none transition duration-700 animate-shimmer`}
              />
            </button>
          );
        })}
      </div>

      {/* Elite Packages */}
      <h2 className="text-2xl font-bold text-white mb-4 mt-6">Elite Access</h2>
      <div className="flex justify-center gap-4 flex-nowrap overflow-x-auto px-2 pb-10">
        {elitePlans.map((pkg) => {
          const isSelected = selected?.id === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelected(pkg)}
              className={`relative w-60 h-[34rem] bg-[url('/slate.png')] bg-blend-overlay bg-cover p-6 rounded-lg border-2 ${pkg.raw.glow} text-white text-left flex flex-col justify-between transition transform hover:scale-105 hover:ring-4 hover:shadow-2xl shadow-[0_15px_40px_rgba(0,0,0,0.3)] overflow-hidden ${isSelected ? "ring-4" : ""}`}
              style={{ marginTop: "20px" }}
            >
              <div>
                <h3 className={`text-xl font-bold mb-2 ${pkg.raw.glow}`}>{pkg.name}</h3>
                <p className="text-lg font-bold mb-2">{pkg.price}</p>
                <ul className="text-sm space-y-1 mb-4">
                  {pkg.raw.features.map((f, j) => (
                    <li key={j}>• {f}</li>
                  ))}
                </ul>
                <div className="text-xs text-white/80">Covers <b>1 companion</b> • Premium eligible</div>
              </div>
              <div
                className={`w-full py-2 px-4 rounded font-semibold text-center bg-black/90 text-white shadow-[0_0_10px_2px] ${pkg.raw.glowShadow} hover:shadow-[0_0_20px_6px] hover:${pkg.raw.glowShadow} transition-all duration-300 ease-in-out backdrop-blur-sm`}
              >
                Select
              </div>
            </button>
          );
        })}
      </div>

      {/* Harem Tier */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-1 mb-6">
        The Harem Experience
      </h2>
      <div className="flex justify-center mt-4 mb-8">
        <button
          type="button"
          onClick={() => setSelected(haremPlan)}
          className={`relative w-144 h-[24rem] p-6 rounded-lg border-2 ${haremPlan.raw.bgClass} flex flex-col justify-between transition transform hover:scale-105 shadow-[0_15px_40px_rgba(255,215,0,0.3)] hover:shadow-[0_20px_50px_rgba(255,215,0,0.5)] ${selected?.id === haremPlan.id ? "ring-4 ring-yellow-400" : ""}`}
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
            {haremPlan.name}
          </div>

          <div>
            <p className="text-xl font-bold mb-2">{haremPlan.price}</p>
            <ul className="text-sm space-y-1 mb-4 text-white">
              {haremPlan.raw.features.map((f, j) => (
                <li key={j}>• {f}</li>
              ))}
            </ul>
            <div className="text-xs text-white/90 text-center">Covers <b>1 companion</b> • Premium eligible</div>
          </div>

          <div className="flex justify-center">
            <div className="px-6 py-2 rounded-full font-semibold bg-black text-white shadow-[0_0_10px_2px_rgba(255,215,0,0.4)] transition-all duration-300 ease-in-out hover:shadow-[0_0_40px_10px_rgba(255,215,0,0.7)] hover:ring-4 hover:ring-yellow-400 hover:scale-105">
              Select
            </div>
          </div>
        </button>
      </div>

      {/* Footer actions */}
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 pb-20">
        <Link href="/create" className="text-sm underline text-gray-500 dark:text-gray-400">
          Back to Create
        </Link>
        <button
          onClick={startCheckout}
          disabled={!selected || (selectionBlocksPremium && selected.kind === "standard")}
          className="rounded-xl px-4 py-2 font-semibold bg-pink-600 text-white disabled:opacity-50"
        >
          {selected?.name?.toLowerCase() === "free" ? "Try for Free" : "Continue"}
        </button>
      </div>
    </main>
  );
}
