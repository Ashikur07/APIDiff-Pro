import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Response Diff & QA Reporter",
  description:
    "Lightweight client-side API JSON comparison tool for QA engineers. Compare Dev vs Stage and copy defect notes for Google Sheets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
