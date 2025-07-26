'use client';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen justify-between">
      <main className="max-w-3xl mx-auto px-4 py-12 text-white flex-grow">
        <h1 className="text-3xl font-bold mb-6">Contact</h1>

        <p className="text-gray-300 text-sm">
          For questions, feedback, or support, please email us at{' '}
          <a
            href="mailto:support@aijin.ai"
            className="underline hover:text-white"
          >
            support@aijin.ai
          </a>.
        </p>
      </main>
    </div>
  );
}
