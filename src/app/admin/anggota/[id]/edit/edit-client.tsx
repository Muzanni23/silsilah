"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Person } from "@/lib/types";
import { CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PersonForm, { PersonFormData } from "@/components/forms/person-form";
import { updatePerson } from "@/lib/api";

export default function EditPersonClient({ person }: { person: Partial<Person> }) {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: PersonFormData) => {
    setLoading(true);
    try {
      await updatePerson(person.id!, data as unknown as Record<string, unknown>);
      setSuccess(true);
      // Optional: router.refresh() untuk mengupdate server data jika kembali ke halaman sebelumnya
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui data.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-fade-in-scale">
        <div className="w-16 h-16 rounded-full bg-[var(--success-bg)] flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-[var(--success)]" />
        </div>
        <h2 className="text-xl font-bold mb-2">Pembaruan Berhasil!</h2>
        <p className="text-sm text-muted mb-6">
          Data anggota keluarga telah berhasil diperbarui secara langsung.
        </p>
        <Link href={`/admin/anggota`}
          className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-white/5 transition-colors">
          Kembali ke Daftar Anggota
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/anggota`} className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-muted hover:text-foreground">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold mb-1">Edit Anggota Keluarga</h1>
          <p className="text-sm text-muted">Akses edit cepat (Bypass approval)</p>
        </div>
      </div>

      <PersonForm 
        initialData={person} 
        onSubmit={handleSubmit} 
        loading={loading} 
        submitLabel="Simpan Perubahan" 
      />
    </div>
  );
}
