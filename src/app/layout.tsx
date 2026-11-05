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
          <body className="min-h-full w-full flex flex-col bg-black">
            <CustomCursor />
            {children}
          </body>
        </html>
        );
}
