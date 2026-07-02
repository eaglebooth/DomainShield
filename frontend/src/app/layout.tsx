import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DomainShield",
  description: "On-chain brand domain squatting insurance powered by GenLayer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
