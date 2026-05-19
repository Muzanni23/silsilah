import Link from "next/link";
import {
  TreePine,
  Users,
  MapPin,
  History,
  ArrowRight,
  Layers,
  Globe,
  Heart,
  UserPlus,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { getSession } from "@/lib/api-helpers";

const stats = [
  { label: "Anggota Keluarga", value: "500+", icon: Users },
  { label: "Generasi", value: "6", icon: Layers },
  { label: "Cabang Keluarga", value: "8+", icon: TreePine },
  { label: "Negara", value: "3", icon: Globe },
];

const features = [
  {
    icon: TreePine,
    title: "Pohon Keluarga Interaktif",
    desc: "Visualisasi silsilah dari Abd. Mutthalib hingga generasi terkini dengan zoom, pan, dan detail setiap anggota.",
  },
  {
    icon: MapPin,
    title: "Peta Domisili & Makam",
    desc: "Temukan lokasi anggota keluarga dan lokasi makam untuk ziarah dengan peta interaktif.",
  },
  {
    icon: Users,
    title: "Kontribusi Data",
    desc: "Anggota keluarga dapat menambah dan memperbarui data silsilah dengan sistem persetujuan admin.",
  },
  {
    icon: History,
    title: "Lestarikan Sejarah",
    desc: "Digitalisasi buku silsilah Bani Abd. Mutthalib tahun 2001 agar generasi mendatang tetap mengenal akar keluarga.",
  },
];

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-gold/3 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            Silsilah Keluarga
            <span className="block text-gradient-gold mt-2">
              Bani Abd. Mutthalib
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Melestarikan ikatan keluarga lintas generasi. Temukan hubungan
            kekerabatan, hubungi saudara, dan jelajahi sejarah keluarga besar
            kita.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/pohon"
              className="group flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-gold to-gold-dark text-background hover:brightness-110 transition-all shadow-lg shadow-gold/20"
            >
              <TreePine size={18} />
              Lihat Pohon Keluarga
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/peta"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-white/5 transition-all"
            >
              <MapPin size={18} />
              Jelajahi Peta
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-6 text-center hover:border-gold/30 transition-colors"
            >
              <stat.icon
                size={24}
                className="mx-auto mb-3 text-gold"
              />
              <p className="text-3xl font-bold text-gradient-gold">
                {stat.value}
              </p>
              <p className="text-sm text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Fitur Platform
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              Platform modern untuk menghubungkan keluarga besar Bani Abd.
              Mutthalib di seluruh dunia.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 stagger-children">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 hover:border-gold/20 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-gold-muted flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <f.icon size={20} className="text-gold-light" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!session && (
        <section className="px-4 py-16">
          <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-10 border-gold/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/3 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Bergabung Bersama Kami
              </h2>
              <p className="text-muted mb-6 max-w-lg mx-auto">
                Daftarkan diri Anda untuk melengkapi data keluarga, menambah
                anggota baru, dan menjaga silsilah keluarga tetap terkini.
              </p>
              <Link
                href="/daftar"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-gold to-gold-dark text-background hover:brightness-110 transition-all"
              >
                <UserPlus size={18} />
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-8 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium">
              Silsilah Bani Abd. Mutthalib
            </p>
            <p className="text-xs text-muted mt-0.5">
              Referensi: Buku Silsilah 2001, disusun oleh H. Abd. Mushawwir Z.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2024–2026 baniabdmutthalib.id
          </p>
        </div>
      </footer>
    </div>
  );
}


