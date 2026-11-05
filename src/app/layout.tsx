import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "Sahana's Portfolio",
  description: "Sahana Santosh Nayak — Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full w-full antialiased select-none">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Creepster&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full w-full flex flex-col bg-black">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
