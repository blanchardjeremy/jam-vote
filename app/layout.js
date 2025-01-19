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
    template: '%s | Jam Vote',
    default: 'Jam Vote - Turn your living room into a stage',
  },
  description: "Create jam sessions, share songs, and make music together from the comfort of your couch",
  keywords: ["music", "jam", "guitar", "piano", "drums", "vocals", "living room", "couch jam"],
  authors: [{ name: "Jam Vote" }],
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
    title: 'Jam Vote',
    description: 'Turn your living room into a stage - Create jam sessions, share songs, and make music together',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} font-sans antialiased`}>
      <body className="min-h-screen">
        <NavigationProgress />
        <AppLayout>{children}</AppLayout>
        <Toaster />
      </body>
    </html>
  );
} 