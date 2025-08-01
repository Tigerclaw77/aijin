'use client';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col flex-grow">
      <div className="max-w-3xl w-full mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6 text-white">Privacy & Legal</h1>

        <div className="space-y-6 text-sm text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">CSAM Compliance</h2>
            <p>
              Aijin.ai strictly prohibits any use of the platform that violates laws concerning child sexual abuse material (CSAM). We do not allow, generate, or tolerate any content that depicts or implies minors in sexual contexts. Any such attempts, including prompt engineering to bypass filters, will be blocked and may result in account suspension or termination. Persistent or malicious attempts may be reported to relevant authorities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">User Image Handling</h2>
            <p>
              All user-uploaded images are processed in-memory to extract descriptive information and are then discarded. No images are permanently stored unless explicitly retained for a user-requested function (e.g. image insertion). This system is designed to protect privacy while allowing meaningful interaction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Safety & Monitoring</h2>
            <p>
              Aijin.ai reserves the right to delete images from history, reset companions, or roll back data in the event of corruption or violations of our safety policies. User chats are not monitored by humans, but statistical or automated reviews may occur to maintain platform safety.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Platform Intent</h2>
            <p>
              Our AI services are intended to foster emotionally engaging, consensual, adult-only experiences. While sexual content may occur, it is considered a by-product of deeper relationships. The platform does not support or promote exploitative fantasies or interactions that violate local laws or our core values.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">User Agreement</h2>
            <p>
              By using Aijin.ai, you agree to these terms and confirm that you are of legal age in your jurisdiction.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
