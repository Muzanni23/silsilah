import type { Metadata } from "next";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Pohon Keluarga — Silsilah Bani Abd. Mutthalib",
  description: "Visualisasi interaktif silsilah keluarga Bani Abd. Mutthalib dari generasi pertama hingga saat ini.",
};

export default function PohonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
