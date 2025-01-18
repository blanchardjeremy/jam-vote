import { Inter } from "next/font/google";
import "@/styles/globals.css";
import AppLayout from "@/components/layouts/AppLayout";
import { Toaster } from "@/components/ui/sonner"
import { NavigationProgress } from "@/components/ui/navigation-progress"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: '--font-inter',
});

export const metadata = {
  title: {
    template: '%s | Music Jam',
    default: 'Music Jam - A platform for musicians to jam together',
  },
  description: "A platform for musicians to jam together",
  keywords: ["music", "jam", "guitar", "piano", "drums", "vocals"],
  authors: [{ name: "Music Jam" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#000000",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    title: 'Music Jam',
    description: 'A platform for musicians to jam together',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} font-sans antialiased`}>
      <body className="min-h-screen pb-64">
        <NavigationProgress />
        <AppLayout>{children}</AppLayout>
        <Toaster />
      </body>
    </html>
  );
} 