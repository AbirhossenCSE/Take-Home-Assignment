"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function ChatPage() {
  const router = useRouter();
  const { token, currentUser } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !token) {
      router.push('/login');
    }
  }, [token, isMounted, router]);

  // Don't render anything until we've mounted and verified auth state
  // to avoid hydration mismatch and flickering
  if (!isMounted || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to Chat, {currentUser?.name}!</h1>
        <p className="text-gray-400">The chat interface will be built here.</p>
        <button 
          onClick={() => {
            useAuthStore.getState().logout();
          }}
          className="mt-8 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
