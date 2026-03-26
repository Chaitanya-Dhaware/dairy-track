import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dairy Track",
  description: "Dairy Sales Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F5F7F9] text-gray-900 font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
