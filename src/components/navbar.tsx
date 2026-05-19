"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  TreePine,
  Map,
  LogIn,
  UserPlus,
  Menu,
  X,
  LayoutDashboard,
  Shield,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import GlobalSearch from "./global-search";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { currentUser, isLoggedIn, isLoading, logout, checkSession } = useAppStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/pohon", label: "Pohon Keluarga", icon: TreePine },
    { href: "/peta", label: "Peta", icon: Map },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-[9999] glass border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-light to-gold-dark flex items-center justify-center text-background font-bold text-sm transition-transform group-hover:scale-105">
              ب
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Bani Abd. Mutthalib
              </p>
              <p className="text-[11px] text-muted leading-tight">
                Silsilah Keluarga
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? "bg-gold-muted text-gold-light"
                    : "text-muted hover:text-foreground hover:bg-white/5"
                }`}
              >
                {link.icon && <link.icon size={16} />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Global Search */}
          <div className="hidden md:block">
            <GlobalSearch />
          </div>

          {/* Auth / User Menu */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn && currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-background text-xs font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="text-sm text-foreground">
                    {currentUser.name}
                  </span>
                  <ChevronDown size={14} className="text-muted" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl glass border border-border shadow-xl animate-fade-in-scale">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium">{currentUser.name}</p>
                      <p className="text-xs text-muted">{currentUser.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold-muted text-gold-light">
                          {currentUser.role}
                        </span>

                      </div>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/dasbor"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard size={15} />
                        Dasbor Saya
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                        >
                          <Shield size={15} />
                          Admin CMS
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
                      >
                        <LogOut size={15} />
                        Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/masuk"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <LogIn size={15} />
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-gold to-gold-dark text-background hover:brightness-110 transition-all"
                >
                  <UserPlus size={15} />
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-muted"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-gold-muted text-gold-light"
                    : "text-muted hover:text-foreground hover:bg-white/5"
                }`}
              >
                {link.icon && <link.icon size={16} />}
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border pt-2 mt-2 space-y-1">
              {!isLoggedIn ? (
                <>
                  <Link
                    href="/masuk"
                    onClick={() => setMobileOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5"
                  >
                    <LogIn size={16} />
                    Masuk
                  </Link>

                </>
              ) : (
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-danger/10"
                >
                  <LogOut size={16} />
                  Keluar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
