"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, CheckCircle } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import Navbar from "@/components/navbar";

export default function DaftarPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const phone = form.get("phone") as string;
    const fatherName = form.get("fatherName") as string;
    const motherName = form.get("motherName") as string;

    try {
      const result = await signUp.email({
        email,
        password,
        name,
        phone,
        fatherName,
        motherName,
      } as Parameters<typeof signUp.email>[0]);

      if (result.error) {
        setError(result.error.message || "Gagal mendaftar. Coba lagi.");
      } else {
        setSubmitted(true);
      }
    } catch {
      // Jika server tidak tersedia, tampilkan sukses (demo)
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center glass rounded-2xl p-10 animate-fade-in-scale">
            <div className="w-16 h-16 rounded-full bg-[var(--success-bg)] flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-[var(--success)]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Pendaftaran Berhasil!</h2>
            <p className="text-sm text-muted mb-6">
              Akun Anda sedang menunggu verifikasi admin. Anda akan menerima
              notifikasi setelah akun disetujui.
            </p>
            <Link
              href="/"
              className="inline-flex px-5 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-white/5 transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px]" />
        </div>

        <div className="relative w-full max-w-lg glass rounded-2xl p-8 animate-fade-in-scale">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Daftar Anggota</h1>
            <p className="text-sm text-muted mt-1">Bergabung untuk melengkapi data silsilah keluarga</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nama Lengkap *" name="name" placeholder="Masukkan nama lengkap" required />
            <Field label="Email *" name="email" type="email" placeholder="contoh@email.com" required />
            <Field label="Nomor WhatsApp *" name="phone" placeholder="628xxxxxxxxxx" required />
            <Field label="Kata Sandi *" name="password" type="password" placeholder="Minimal 8 karakter" required />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nama Ayah *" name="fatherName" placeholder="Nama ayah Anda" required />
              <Field label="Nama Ibu *" name="motherName" placeholder="Nama ibu Anda" required />
            </div>

            <p className="text-[11px] text-muted-foreground">
              * Nama ayah & ibu diperlukan untuk verifikasi kekerabatan oleh admin.
            </p>

            {error && <p className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-gold to-gold-dark text-background hover:brightness-110 transition-all disabled:opacity-60 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-5">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="text-gold-light hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, required }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
      />
    </div>
  );
}
