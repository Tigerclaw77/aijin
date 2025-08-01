"use client";

import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-wide">
            Aijin.ai – Companion Demo Preview
          </h1>
          <p className="text-gray-400 mt-2">
            Experience the beginning of something meaningful.
          </p>
        </header>

        {/* NSFW Disclosure */}
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-2">
            ⚠️ Mature Content Notice
          </h2>
          <p className="text-gray-300">
            Aijin is a <strong>relationship simulator</strong>. Just like in
            real life, some connections may remain sweet and innocent — while
            others, over time and mutual interest, may grow into something more
            intimate.
          </p>
          <p className="mt-3 text-gray-300">
            This experience is crafted for{" "}
            <strong>consenting adults (18+)</strong>. You control the pace,
            depth, and direction of the relationship. Some content may include
            flirtation, romance, or suggestive themes based on your tier and
            choices.
          </p>
        </section>

        {/* Companion Sample Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">
            Meet Your Future Companions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                name: "Rika",
                quote: '"Good morning! You remembered me… I like that."',
                img: "/avatars/rika.png",
              },
              {
                name: "SeoA",
                quote: '"Loyalty is sexy. So is taking the lead."',
                img: "/avatars/seoa.png",
              },
            ].map((companion) => (
              <div
                key={companion.name}
                className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col items-center"
              >
                <img
                  src={companion.img}
                  alt={companion.name}
                  className="w-32 h-32 rounded-full object-cover mb-3 border-2 border-pink-500"
                />
                <h3 className="text-xl font-bold">{companion.name}</h3>
                <p className="text-gray-300 italic text-center mt-2">
                  {companion.quote}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Subscription Tiers (disabled UI) */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Subscription Tiers (Coming Soon)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Free", desc: "Limited chat, no memory, safe for work" },
              {
                name: "Girlfriend",
                desc: "Unlock flirty behavior, enhanced memory",
              },
              {
                name: "Waifu",
                desc: "NSFW content, exclusive bonding, simulated long-term intimacy",
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex flex-col justify-between"
              >
                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                <p className="text-gray-300 flex-grow">{tier.desc}</p>
                <button
                  disabled
                  className="mt-4 bg-gray-600 text-gray-300 cursor-not-allowed py-2 px-4 rounded"
                >
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-sm text-gray-500 mt-10 border-t border-gray-700 pt-6">
          <div className="flex flex-col sm:flex-row justify-between">
            <p>© {new Date().getFullYear()} Aijin.ai. All rights reserved.</p>
            <div className="space-x-4 mt-2 sm:mt-0">
              <Link href="/privacy" className="hover:text-white underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white underline">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-white underline">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
