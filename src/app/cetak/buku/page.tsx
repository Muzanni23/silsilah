import { prisma } from "@/lib/prisma";
import { Gender } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CetakBukuPage() {
  const persons = await prisma.person.findMany({
    where: { status: "APPROVED" },
    include: {
      childrenAsFather: { select: { fullName: true } },
      childrenAsMother: { select: { fullName: true } },
      marriagesAsHusband: { include: { wife: { select: { fullName: true } } } },
      marriagesAsWife: { include: { husband: { select: { fullName: true } } } },
    },
    orderBy: [
      { generationNumber: "asc" },
      { birthDate: "asc" },
    ],
  });

  // Group by generation
  const byGen: Record<number, typeof persons> = {};
  persons.forEach((p) => {
    const gen = p.generationNumber || 1;
    if (!byGen[gen]) byGen[gen] = [];
    byGen[gen].push(p);
  });

  const generations = Object.keys(byGen).map(Number).sort((a, b) => a - b);

  return (
    <div className="bg-white min-h-screen text-black print:bg-white print:text-black">
      {/* Tombol Cetak (hanya tampil di layar, sembunyi saat diprint) */}
      <div className="fixed top-4 right-4 print:hidden">
        <button
          id="print-btn"
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700"
        >
          🖨️ Cetak PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-8 print:p-0 print:max-w-none">
        {/* Halaman Sampul */}
        <div className="text-center mb-16 border-b-4 border-double border-gray-800 pb-12 print:break-after-page print:flex print:flex-col print:justify-center print:min-h-screen">
          <h1 className="text-4xl font-serif font-bold mb-4">Buku Silsilah</h1>
          <h2 className="text-3xl font-serif text-gray-700 mb-8">Bani Abd. Mutthalib</h2>
          <p className="text-gray-500 italic">Dicetak pada: {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Daftar Isi / Generasi */}
        {generations.map((gen) => (
          <div key={gen} className="mb-12 print:break-inside-avoid">
            <h3 className="text-2xl font-serif font-bold bg-gray-100 p-3 mb-6 border-l-4 border-gray-800">
              Generasi Ke-{gen}
            </h3>
            <div className="space-y-6">
              {byGen[gen].map((p, idx) => {
                const spouses = p.gender === Gender.MALE 
                  ? p.marriagesAsHusband.map(m => m.wife?.fullName).filter(Boolean)
                  : p.marriagesAsWife.map(m => m.husband?.fullName).filter(Boolean);
                
                const children = p.gender === Gender.MALE
                  ? p.childrenAsFather.map(c => c.fullName)
                  : p.childrenAsMother.map(c => c.fullName);

                return (
                  <div key={p.id} className="pl-4 border-l-2 border-gray-200">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-lg">{idx + 1}. {p.fullName}</span>
                      {p.nickname && <span className="text-gray-600 italic">({p.nickname})</span>}
                      <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">{p.gender === Gender.MALE ? 'L' : 'P'}</span>
                      {!p.isAlive && <span className="text-xs px-2 py-0.5 bg-gray-800 text-white rounded-full">Alm/Almh</span>}
                    </div>

                    <div className="mt-2 text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                      {p.birthDate && <div><span className="font-semibold">Lahir:</span> {p.birthDate.split('T')[0]} {p.birthPlace ? `di ${p.birthPlace}` : ''}</div>}
                      {!p.isAlive && p.deathDate && <div><span className="font-semibold">Wafat:</span> {p.deathDate.split('T')[0]} {p.graveKabupaten ? `(Makam: ${p.graveKabupaten})` : ''}</div>}
                      {p.kabupaten && <div><span className="font-semibold">Domisili:</span> {p.kabupaten}</div>}
                      {p.familyBranch && <div><span className="font-semibold">Cabang:</span> {p.familyBranch}</div>}
                    </div>

                    {spouses.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="font-semibold text-gray-800">Pasangan:</span> {spouses.join(", ")}
                      </div>
                    )}

                    {children.length > 0 && (
                      <div className="mt-1 text-sm">
                        <span className="font-semibold text-gray-800">Anak:</span> {children.join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            const btn = document.getElementById('print-btn');
            if(btn) btn.onclick = () => window.print();
          `,
        }}
      />
    </div>
  );
}
