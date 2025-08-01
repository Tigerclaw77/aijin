'use client';

export default function TermsPage() {
  return (
    <div className="flex flex-col flex-grow">
      <div className="max-w-3xl w-full mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6 text-white">Terms of Use</h1>

        <div className="space-y-6 text-sm text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Eligibility</h2>
            <p>
              You must be at least 18 years old to use this service. Aijin.ai is not intended for minors. Any misrepresentation of age is grounds for account suspension or deletion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. Acceptable Use</h2>
            <p>
              Users are expected to interact respectfully with AI companions. Attempting to abuse, exploit, or circumvent system safeguards may result in access restrictions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. Intellectual Property</h2>
            <p>
              All AI-generated characters, content, and assets are the property of Aijin.ai and may not be copied, redistributed, or used commercially without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. Termination</h2>
            <p>
              We reserve the right to suspend or delete any account at our discretion for violations of our terms or for any reason we deem necessary to protect the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Updates</h2>
            <p>
              These terms may be updated occasionally. Continued use of the platform after updates constitutes acceptance of the new terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
