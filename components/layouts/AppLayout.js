'use client';

import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";

export default function AppLayout({ children }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 ">
      <Navigation />
      
      {/* Main content */}
      <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 