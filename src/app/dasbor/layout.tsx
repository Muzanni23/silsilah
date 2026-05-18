"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import { LayoutDashboard, PlusCircle, History, User } from "lucide-react";

const sidebarLinks = [
  { href: "/dasbor", label: "Dasbor", icon: LayoutDashboard, exact: true },
  { href: "/dasbor/tambah", label: "Tambah Anggota", icon: PlusCircle },
  { href: "/dasbor/riwayat", label: "Riwayat Submisi", icon: History },
  { href: "/dasbor/profil", label: "Profil Saya", icon: User },
];

export default function DasborLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card/30 p-4 gap-1">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-3">
            Menu Member
          </p>
          {sidebarLinks.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-gold-muted text-gold-light" : "text-muted hover:text-foreground hover:bg-white/5"
                }`}
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </aside>

        {/* Mobile Nav */}
        <div className="md:hidden flex border-b border-border bg-card/30 overflow-x-auto">
          {sidebarLinks.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  active ? "text-gold-light border-b-2 border-gold" : "text-muted hover:text-foreground"
                }`}
              >
                <link.icon size={14} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
