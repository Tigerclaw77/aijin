"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full text-sm text-gray-400 text-center py-6 bg-black border-t border-gray-800">
      <p>&copy; {new Date().getFullYear()} Aijin.ai. All rights reserved.</p>

      <div className="mt-2 flex justify-center flex-wrap gap-3 text-gray-400 text-xs">
        <Link href="/privacy" className="hover:text-white underline">
          Privacy & Legal
        </Link>
        <span>&middot;</span>
        <Link href="/terms" className="hover:text-white underline">
          Terms of Use
        </Link>
        <span>&middot;</span>
        <Link href="/disclaimer" className="hover:text-white underline">
          Disclaimer
        </Link>
        <span>&middot;</span>
        <Link href="/faq" className="hover:text-white underline">
          FAQ
        </Link>
        <span>&middot;</span>
        <Link href="/contact" className="hover:text-white underline">
          Contact
        </Link>
      </div>

      <p className="mt-2 text-xs italic text-gray-500">
        AI companions for meaningful virtual relationships, available anytime.
      </p>
    </footer>
  );
}
