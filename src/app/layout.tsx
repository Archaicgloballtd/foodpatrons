import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import MobileBottomNav from "@/components/MobileBottomNav";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "foodpatrons — Discover food & events around you",
  description: "Discover food & events around you. Make food friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col pb-16 sm:pb-0">
        {children}
        <MobileBottomNav />
        <AnalyticsTracker />
      </body>
    </html>
  );
}
