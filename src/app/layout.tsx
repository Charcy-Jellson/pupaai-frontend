import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pupa AI Studio",
  description: "Transform your creative workflow with AI-powered tools",
  keywords: ["AI", "Image Processing", "Video Tools", "Creative Suite"],
  authors: [{ name: "Pupa AI" }],
  openGraph: {
    title: "Pupa AI Studio",
    description: "Transform your creative workflow with AI-powered tools",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
          suppressHydrationWarning
        >
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

