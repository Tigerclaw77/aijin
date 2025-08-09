"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import useAuthStore from "../../store/authStore";  // Assuming you have auth store for state management

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();  // Assuming you have auth store

  const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    // Check if the user is logged in when the component mounts
    if (!user) {
      router.push("/login"); // If not logged in, redirect to login
    } else {
      setLoading(false); // If user is logged in, stop loading
    }
  }, [user, router]);  // Dependency on user state to trigger rerun

  if (loading) {
    return <div>Loading...</div>; // Display a loading screen while checking authentication
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Welcome, {user.name}</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your companions and account here.</p>

          <div className="mt-6">
            <button
              onClick={() => router.push("/create-companion")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
              Create New Companion
            </button>
          </div>

          <div className="mt-4">
            <button
              onClick={() => router.push("/settings")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
            >
              Account Settings
            </button>
          </div>

          <div className="mt-6">
            <button
              onClick={() => logout()}  // Assuming you have a logout function in auth store
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-4 text-center">
        <p>&copy; 2025 Aijin.ai. All rights reserved.</p>
      </footer>
    </div>
  );
}
