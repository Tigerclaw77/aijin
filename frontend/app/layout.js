import "./globals.css";
import { Inter, Roboto_Mono, Great_Vibes } from "next/font/google";

import Header from "../components/Header";
import Footer from "../components/Footer";
import SyncCompanionState from "../components/SyncCompanionState";
import ClientLayout from "../components/ClientLayout";
import SplashGate from "../components/SplashGate";


const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
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
      className={`${geistSans.variable} ${geistMono.variable} ${greatVibes.variable} dark h-full`}
    >
      <body className="antialiased bg-black text-white flex flex-col min-h-screen">
        <SplashGate>
          <ClientLayout>
            <Header />
            <SyncCompanionState />
            <main className="flex-grow">{children}</main>
            <Footer />
          </ClientLayout>
        </SplashGate>
      </body>
    </html>
  );
}
