'use client';

import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function AppLayout({ children }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Main content */}
      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
} 