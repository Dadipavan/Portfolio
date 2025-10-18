import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Sai Pavan | Data Scientist & ML Engineer",
  description:
    "Portfolio of Valavala Dadi Naga Siva Sai Pavan - Aspiring Data Scientist and ML Engineer with expertise in Python, Machine Learning, and Data Analysis.",
  keywords: [
    "Data Science",
    "Machine Learning",
    "Python",
    "Portfolio",
    "Sai Pavan",
    "ML Engineer",
    "Data Analyst",
  ],
  authors: [{ name: "Valavala Dadi Naga Siva Sai Pavan" }],
  openGraph: {
    title: "Sai Pavan | Data Scientist & ML Engineer",
    description: "Aspiring Data Scientist and ML Engineer with expertise in Python and Machine Learning",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sai Pavan | Data Scientist & ML Engineer",
    description: "Aspiring Data Scientist and ML Engineer with expertise in Python and Machine Learning",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
