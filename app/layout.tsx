import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Bulk Xtream Checker",
  description: "Verify IPTV/Xtream Codes credentials in bulk and display active accounts"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
