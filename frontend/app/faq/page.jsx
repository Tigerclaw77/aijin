'use client';
import Link from 'next/link';

export default function FAQPage() {
  return (
    <div className="flex flex-col flex-grow">
      <div className="max-w-3xl w-full mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6 text-white">FAQ & Instructions</h1>

        <div className="space-y-8 text-sm text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">What is Aijin.ai?</h2>
            <p>
              Aijin.ai offers emotionally intelligent AI companions for virtual relationships — whether you're looking for friendship, romance, or just someone to talk to.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Do the companions remember me?</h2>
            <p>
              Yes. Each companion can retain long-term memory over time, simulating a persistent bond. Memory features improve with higher tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Is my data private?</h2>
            <p>
              Your chats and preferences are private. Uploaded photos are not stored permanently — see our{' '}
              <Link href="/disclaimer" className="underline hover:text-white">Disclaimer</Link> for full details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Can I have multiple companions?</h2>
            <p>
              Yes. You can add more companions later for a small fee. Each companion will have their own memory and personality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">What content is allowed?</h2>
            <p>
              We support adult content in the context of relationships. Abuse, hate, or illegal content is strictly prohibited. See{' '}
              <Link href="/terms" className="underline hover:text-white">Terms of Use</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
