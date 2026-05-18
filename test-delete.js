const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDelete() {
  try {
    console.log("Membuat data uji coba (Ayah dan Anak)...");
    const parent = await prisma.person.create({
      data: {
        fullName: "Ayah Uji Coba Hapus",
        gender: "MALE",
        isAlive: true,
        status: "APPROVED"
      }
    });
    
    const child = await prisma.person.create({
      data: {
        fullName: "Anak Uji Coba Hapus",
        gender: "MALE",
        fatherId: parent.id,
        isAlive: true,
        status: "APPROVED"
      }
    });
    
    console.log(`Berhasil dibuat: Ayah (${parent.id}), Anak (${child.id})`);
    
    console.log(`Mencoba menghapus Ayah (${parent.id})...`);
    await prisma.person.delete({
      where: { id: parent.id }
    });
    
    console.log("Penghapusan Ayah berhasil! Menguji apakah anak juga terhapus (Cascade)...");
    const childCheck = await prisma.person.findUnique({
      where: { id: child.id }
    });
    
    if (!childCheck) {
      console.log("SUKSES: Anak juga berhasil ikut terhapus secara otomatis (Cascade)!");
    } else {
      console.error("GAGAL: Anak masih ada di database!");
    }
    
  } catch (e) {
    console.error("ERROR saat menghapus:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDelete();
