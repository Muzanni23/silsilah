"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import { LayoutDashboard, CheckSquare, Users, UserCog, Link2Off, Activity } from "lucide-react";

const sidebarLinks = [
  { href: "/admin", label: "Dasbor Admin", icon: LayoutDashboard, exact: true },
  { href: "/admin/persetujuan", label: "Persetujuan", icon: CheckSquare },
  { href: "/admin/anggota", label: "Data Anggota", icon: Users },
  { href: "/admin/pengguna", label: "Manajemen User", icon: UserCog },
  { href: "/admin/orphan", label: "Node Tidak Terhubung", icon: Link2Off },
  { href: "/admin/aktivitas", label: "Log Aktivitas", icon: Activity },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/30 p-4 gap-1">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-3">Admin CMS</p>
          {sidebarLinks.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}
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

        <div className="lg:hidden flex border-b border-border bg-card/30 overflow-x-auto">
          {sidebarLinks.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}
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

        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
