import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SyncCompanionState from "../components/SyncCompanionState";
import { Geist, Geist_Mono, Great_Vibes } from "next/font/google";
import ClientLayout from "../components/ClientLayout"; // new file

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin"],
});

export const metadata = {
  title: "Aijin",
  description: "AI Companions with Emotion + Memory",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${greatVibes.variable} dark`}
    >
      <body className="antialiased bg-black text-white flex flex-col min-h-screen">
        <ClientLayout>
          <Header />
          <SyncCompanionState />
          <main className="flex-grow">{children}</main>
          <Footer />
        </ClientLayout>
      </body>
    </html>
  );
}
