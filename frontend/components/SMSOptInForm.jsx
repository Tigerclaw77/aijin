'use client';

import { useState } from 'react';

export default function SMSOptInForm() {
  const [phone, setPhone] = useState('');
  const [companion, setCompanion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/sms-optin', {
      method: 'POST',
      body: JSON.stringify({ phone, companion }),
    });

    if (res.ok) setSubmitted(true);
  };

  if (submitted) {
    return <p className="text-green-400 mt-4">Thanks! You're subscribed via SMS.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm text-gray-300">
      <label className="block">
        Phone Number:
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 555-1234"
          required
          className="mt-1 w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
        />
      </label>

      <label className="block">
        Companion Name (optional):
        <input
          type="text"
          value={companion}
          onChange={(e) => setCompanion(e.target.value)}
          placeholder="e.g. Rika"
          className="mt-1 w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
        />
      </label>

      <label className="block">
        <input type="checkbox" required className="mr-2" />
        I consent to receive SMS messages from Aijin.ai. Message and data rates may apply.
      </label>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
      >
        Join via SMS
      </button>
    </form>
  );
}
