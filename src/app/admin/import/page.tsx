"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, FileUp, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const router = useRouter();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
      },
      error: (err) => {
        alert("Gagal membaca file CSV: " + err.message);
      }
    });
  };

  const handleImport = async () => {
    if (data.length === 0) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const resData = await res.json();
      
      if (!res.ok) throw new Error(resData.error || "Gagal import");

      setResult({ success: resData.successCount, errors: resData.errors });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Import CSV</h1>
          <p className="text-sm text-muted">Import data awal anggota dari buku silsilah 2001.</p>
        </div>
      </div>

      {!result ? (
        <div className="glass rounded-xl p-6">
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <Upload size={32} className="text-gold-light mb-3" />
            <h3 className="font-semibold mb-1">Upload File CSV</h3>
            <p className="text-xs text-muted max-w-sm mb-4">
              Pilih file CSV dengan kolom header: fullName, nickname, gender (L/P), isAlive (TRUE/FALSE), generationNumber, familyBranch, fatherNameFallback, motherNameFallback.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full max-w-xs text-sm text-muted
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-xs file:font-semibold
                file:bg-gold-muted file:text-gold-light
                hover:file:bg-gold/20 file:cursor-pointer cursor-pointer transition-colors"
            />
          </div>

          {data.length > 0 && (
            <div className="mt-8 animate-fade-in">
              <h3 className="font-semibold mb-3">Preview Data ({data.length} baris)</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-card text-muted">
                    <tr>
                      <th className="px-4 py-2 font-medium">Nama</th>
                      <th className="px-4 py-2 font-medium">Gender</th>
                      <th className="px-4 py-2 font-medium">Gen</th>
                      <th className="px-4 py-2 font-medium">Ayah (Teks)</th>
                      <th className="px-4 py-2 font-medium">Ibu (Teks)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="px-4 py-2">{row.fullName || "-"}</td>
                        <td className="px-4 py-2">{row.gender || "-"}</td>
                        <td className="px-4 py-2">{row.generationNumber || "-"}</td>
                        <td className="px-4 py-2">{row.fatherNameFallback || "-"}</td>
                        <td className="px-4 py-2">{row.motherNameFallback || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.length > 5 && (
                <p className="text-xs text-center text-muted mt-2">Menampilkan 5 baris pertama dari {data.length} baris.</p>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Memproses..." : `Import ${data.length} Data Sekarang`}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass rounded-xl p-6 text-center animate-fade-in">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Import Selesai!</h2>
          <p className="text-muted mb-6">Berhasil menambahkan {result.success} data anggota ke sistem.</p>
          
          {result.errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-left max-h-64 overflow-y-auto mb-6">
              <h3 className="text-sm font-bold text-red-500 flex items-center gap-2 mb-2">
                <AlertTriangle size={16} /> Ada {result.errors.length} baris yang gagal:
              </h3>
              <ul className="list-disc list-inside text-xs text-red-400 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button onClick={() => setResult(null)} className="btn-secondary">Import Lagi</button>
            <Link href="/admin/anggota" className="btn-primary">Lihat Data Anggota</Link>
          </div>
        </div>
      )}
    </div>
  );
}
