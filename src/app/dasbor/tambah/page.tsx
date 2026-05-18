"use client";

import { useState } from "react";
import { createSubmission, createPerson } from "@/lib/api";
import { CheckCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import PersonForm, { PersonFormData } from "@/components/forms/person-form";

export default function TambahPage() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAppStore();
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

  const handleSubmit = async (data: PersonFormData) => {
    setLoading(true);
    try {
      if (isAdmin) {
        await createPerson(data as unknown as Record<string, unknown>);
      } else {
        await createSubmission({ personData: data as unknown as Record<string, unknown>, changeType: "ADD" });
      }
      setSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Gagal mengirim data.");
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
        <h2 className="text-xl font-bold mb-2">{isAdmin ? "Data Berhasil Disimpan!" : "Submisi Terkirim!"}</h2>
        <p className="text-sm text-muted mb-6">
          {isAdmin 
            ? "Data anggota keluarga telah berhasil ditambahkan langsung ke dalam sistem."
            : "Data anggota keluarga telah disubmisi dan menunggu persetujuan admin."}
        </p>
        <button onClick={() => setSuccess(false)}
          className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-white/5 transition-colors">
          Tambah Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-xl font-bold mb-1">Tambah Anggota Keluarga</h1>
      <p className="text-sm text-muted mb-6">
        {isAdmin 
          ? "Anda adalah Admin. Data yang diinput akan langsung masuk ke database tanpa persetujuan." 
          : "Data akan menunggu persetujuan admin sebelum masuk ke pohon keluarga."}
      </p>

      <PersonForm onSubmit={handleSubmit} loading={loading} submitLabel="Kirim Submisi" />
    </div>
  );
}
