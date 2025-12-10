import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Advent of Code Solutions",
  description: "My solutions for Advent of Code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Script
          src="https://umami.gerwint.live/script.js"
          data-website-id="4bc5a865-6b82-46f5-bb4e-c68eaa4d575e"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
