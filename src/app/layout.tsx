import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SwingAdmin - Golf Tournament Management",
    template: "%s | SwingAdmin",
  },
  description: "Professional golf tournament management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
