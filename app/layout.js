import { Inter } from "next/font/google";
import "@/styles/globals.css";
import AppLayout from "@/components/layouts/AppLayout";
import { Toaster } from "@/components/ui/sonner"


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: '--font-inter',
});

export const metadata = {
  title: "Music Jam",
  description: "A platform for musicians to jam together",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="A platform for musicians to jam together" />
        <meta name="keywords" content="music, jam, guitar, piano, drums, vocals" />
        <meta name="author" content="Music Jam" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Music Jam" />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen pb-32`}>
        <AppLayout>{children}</AppLayout>
        <Toaster />
      </body>
    </html>
  );
} 