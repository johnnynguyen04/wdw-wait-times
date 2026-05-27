import type { Metadata } from "next";
import { Fraunces, Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif-italic",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Disney Wait Times — A Machine Learning Study | Johnny Nguyen",
  description:
    "A machine learning analysis of 3,146,086 Walt Disney World wait-time records (2015–2021). Gradient Boosting model (R²=0.573) with seasonal trends, holiday impact, and live wait-time predictions across 14 attractions and 4 parks.",
  openGraph: {
    title: "Disney Wait Times — A Machine Learning Study",
    description: "3.15M records · 14 attractions · Gradient Boosting · R²=0.573",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${instrumentSerif.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
