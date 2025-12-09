import type { Metadata } from "next";
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
      <script
        defer
        src="https://umami.gerwint.live/script.js"
        data-website-id="4bc5a865-6b82-46f5-bb4e-c68eaa4d575e"
      ></script>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
