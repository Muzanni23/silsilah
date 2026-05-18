"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff, Shield } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { useAppStore } from "@/lib/store";
import Navbar from "@/components/navbar";

export default function MasukPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginAsDemo, demoMode } = useAppStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Email atau password salah.");
      } else {
        // Refresh session di store
        await useAppStore.getState().checkSession();
        router.push("/dasbor");
      }
    } catch {
      setError("Gagal terhubung ke server. Coba mode demo di bawah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px]" />
        </div>

        <div className="relative w-full max-w-md glass rounded-2xl p-8 animate-fade-in-scale">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-light to-gold-dark flex items-center justify-center text-background font-bold text-xl mx-auto mb-4">
              ب
            </div>
            <h1 className="text-2xl font-bold">Masuk</h1>
            <p className="text-sm text-muted mt-1">Masuk ke platform silsilah keluarga</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@email.com"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-gold to-gold-dark text-background hover:brightness-110 transition-all disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>



          <p className="text-xs text-muted text-center mt-6">
            Belum punya akun?{" "}
            <Link href="/daftar" className="text-gold-light hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
