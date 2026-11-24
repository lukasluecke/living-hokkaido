import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Living Hokkaido",
  description:
    "A place for cultural stories to keep living. Research prototype.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
