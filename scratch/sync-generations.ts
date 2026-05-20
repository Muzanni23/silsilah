import { prisma } from "../src/lib/prisma";

async function syncAllGenerations() {
  console.log("=== MEMULAI SINKRONISASI GENERASI ===");

  // 1. Ambil semua orang dari database
  const allPersons = await prisma.person.findMany({
    select: {
      id: true,
      fullName: true,
      fatherId: true,
      motherId: true,
      generationNumber: true,
    },
  });

  console.log(`Ditemukan total ${allPersons.length} orang di database.`);

  // 2. Cari root members (tidak memiliki ayah dan ibu di database)
  const rootMembers = allPersons.filter(
    (p) => !p.fatherId && !p.motherId
  );

  console.log(`Ditemukan ${rootMembers.length} anggota root (Generasi 1):`);
  for (const root of rootMembers) {
    console.log(` - ${root.fullName}`);
  }

  // 3. Fungsi rekursif untuk update keturunan
  async function updateDescendants(personId: string, currentGen: number) {
    const nextGen = currentGen + 1;

    // Cari anak-anak dari person ini
    const children = allPersons.filter(
      (p) => p.fatherId === personId || p.motherId === personId
    );

    if (children.length > 0) {
      console.log(
        `Mengupdate ${children.length} anak dari ${
          allPersons.find((p) => p.id === personId)?.fullName
        } ke Generasi ${nextGen}...`
      );

      // Update di database
      await prisma.person.updateMany({
        where: {
          id: { in: children.map((c) => c.id) },
        },
        data: {
          generationNumber: nextGen,
        },
      });

      // Update lokal untuk traversal selanjutnya
      for (const child of children) {
        child.generationNumber = nextGen;
        // Rekursif ke cucu/cicit
        await updateDescendants(child.id, nextGen);
      }
    }
  }

  // 4. Jalankan untuk setiap root member
  for (const root of rootMembers) {
    // Pastikan root di database diset ke Generasi 1
    await prisma.person.update({
      where: { id: root.id },
      data: { generationNumber: 1 },
    });
    root.generationNumber = 1;

    // Update seluruh keturunan dari root ini
    await updateDescendants(root.id, 1);
  }

  console.log("=== SINKRONISASI GENERASI SELESAI DENGAN SUKSES ===");
}

syncAllGenerations()
  .catch((err) => {
    console.error("Gagal menyinkronkan generasi:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
