'use client';

import { useRouter, usePathname } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useLayoutSegments } from "next/navigation";

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Home page should be full width. This is super hacky.
  const isFullWidth = pathname === '/';

  const styleVariants = {
    fullWidth: 'w-full mx-auto',
    maxWidth: 'max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8',
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Main content */}
      <main className="flex-1 w-full bg-gray-50">
        <div className={isFullWidth ? styleVariants.fullWidth : styleVariants.maxWidth}>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
} 