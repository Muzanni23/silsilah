import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

// ============================================================
// Seed Script — Silsilah Bani Abd. Mutthalib
// Menginisialisasi database dengan data pohon keluarga 6 generasi
// ============================================================

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL belum diset di .env");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Memulai seeding database...\n");

  // ============================================================
  // 1. USERS — Super Admin + Member
  // ============================================================
  const adminPwd = await hash("admin123", 12);
  const memberPwd = await hash("member123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@baniabdmutthalib.id" },
    update: {},
    create: {
      name: "Admin Utama",
      email: "admin@baniabdmutthalib.id",
      emailVerified: true,
      phone: "6281000000001",
      fatherName: "H. Abd. Rahman",
      motherName: "Siti Khadijah",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.account.upsert({
    where: { id: "seed-admin-account" },
    update: {},
    create: {
      id: "seed-admin-account",
      accountId: admin.id,
      providerId: "credential",
      userId: admin.id,
      password: adminPwd,
    },
  });
  console.log("✅ Admin  : admin@baniabdmutthalib.id / admin123");

  const member = await prisma.user.upsert({
    where: { email: "muzanni@email.com" },
    update: {},
    create: {
      name: "Ahmad Muzanni",
      email: "muzanni@email.com",
      emailVerified: true,
      phone: "6281456789012",
      fatherName: "H. Abd. Rahman",
      motherName: "Siti Khadijah",
      role: "MEMBER",
      status: "ACTIVE",
      approvedBy: admin.id,
      approvedAt: new Date(),
    },
  });

  await prisma.account.upsert({
    where: { id: "seed-member-account" },
    update: {},
    create: {
      id: "seed-member-account",
      accountId: member.id,
      providerId: "credential",
      userId: member.id,
      password: memberPwd,
    },
  });
  console.log("✅ Member : muzanni@email.com / member123\n");

  // ============================================================
  // 2. PERSONS — Pohon Keluarga 6 Generasi
  // ============================================================
  console.log("🌳 Membuat pohon keluarga...");

  // --- Generasi 1 (Leluhur) ---
  const gen1 = await prisma.person.create({
    data: {
      fullName: "Abd. Mutthalib",
      gender: "MALE",
      isAlive: false,
      generationNumber: 1,
      familyBranch: "Root",
      birthPlace: "Bawean, Gresik",
      country: "Indonesia",
      deathDate: "1920-01-01",
      graveAddress: "TPU Sido Gedongbatu",
      graveKabupaten: "Gresik",
      graveProvince: "Jawa Timur",
      graveLatitude: -5.7316,
      graveLongitude: 112.6516,
      graveNotes: "Leluhur utama Bani Abd. Mutthalib",
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });
  console.log("   Gen 1: Abd. Mutthalib (Root)");

  // --- Generasi 2 (3 anak) ---
  const hNoor = await prisma.person.create({
    data: {
      fullName: "H. Noor",
      gender: "MALE",
      isAlive: false,
      generationNumber: 2,
      familyBranch: "Cabang H. Noor",
      fatherId: gen1.id,
      birthPlace: "Bawean, Gresik",
      country: "Indonesia",
      deathDate: "1955-06-15",
      graveAddress: "TPU Sido Gedongbatu",
      graveKabupaten: "Gresik",
      graveProvince: "Jawa Timur",
      graveLatitude: -5.7318,
      graveLongitude: 112.6518,
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });

  const hThabri = await prisma.person.create({
    data: {
      fullName: "H. Thabri",
      gender: "MALE",
      isAlive: false,
      generationNumber: 2,
      familyBranch: "Cabang H. Thabri",
      fatherId: gen1.id,
      birthPlace: "Bawean, Gresik",
      country: "Indonesia",
      deathDate: "1960-03-20",
      graveAddress: "TPU Sido Gedongbatu",
      graveKabupaten: "Gresik",
      graveProvince: "Jawa Timur",
      graveLatitude: -5.732,
      graveLongitude: 112.652,
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });

  const sarihanum = await prisma.person.create({
    data: {
      fullName: "Sarihanum",
      gender: "FEMALE",
      isAlive: false,
      generationNumber: 2,
      familyBranch: "Cabang Sarihanum",
      fatherId: gen1.id,
      birthPlace: "Bawean, Gresik",
      country: "Indonesia",
      deathDate: "1958-08-10",
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });
  console.log("   Gen 2: H. Noor, H. Thabri, Sarihanum");

  // --- Generasi 3 ---
  const hSaid = await prisma.person.create({
    data: {
      fullName: "H. Said",
      gender: "MALE",
      isAlive: false,
      generationNumber: 3,
      familyBranch: "Cabang H. Noor",
      fatherId: hNoor.id,
      birthPlace: "Bawean, Gresik",
      country: "Indonesia",
      deathDate: "1980-11-05",
      graveAddress: "TPU Sangkapura",
      graveKabupaten: "Gresik",
      graveProvince: "Jawa Timur",
      graveLatitude: -5.74,
      graveLongitude: 112.66,
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });

  const hAbdulHamid = await prisma.person.create({
    data: {
      fullName: "H. Abdul Hamid",
      nickname: "Pak Hamid",
      gender: "MALE",
      isAlive: false,
      generationNumber: 3,
      familyBranch: "Cabang H. Thabri",
      fatherId: hThabri.id,
      birthPlace: "Bawean, Gresik",
      birthDate: "1930-05-12",
      country: "Indonesia",
      deathDate: "1995-02-14",
      graveAddress: "TPU Tanah Kusir",
      graveKabupaten: "Jakarta Selatan",
      graveProvince: "DKI Jakarta",
      graveLatitude: -6.2615,
      graveLongitude: 106.7834,
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });
  console.log("   Gen 3: H. Said, H. Abdul Hamid");

  // --- Generasi 4 ---
  const hAbdRahman = await prisma.person.create({
    data: {
      fullName: "H. Abd. Rahman",
      nickname: "Abah Rahman",
      gender: "MALE",
      isAlive: false,
      generationNumber: 4,
      familyBranch: "Cabang H. Noor",
      fatherId: hSaid.id,
      birthPlace: "Bawean, Gresik",
      birthDate: "1950-03-25",
      country: "Indonesia",
      deathDate: "2010-09-30",
      graveAddress: "TPU Karet Bivak",
      graveKabupaten: "Jakarta Pusat",
      graveProvince: "DKI Jakarta",
      graveLatitude: -6.1944,
      graveLongitude: 106.8227,
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });

  const hZubaidi = await prisma.person.create({
    data: {
      fullName: "H. Zubaidi",
      gender: "MALE",
      isAlive: true,
      generationNumber: 4,
      familyBranch: "Cabang H. Noor",
      fatherId: hSaid.id,
      birthPlace: "Bawean, Gresik",
      birthDate: "1955-08-17",
      country: "Indonesia",
      address: "Jl. Raya Darmo No. 15",
      kelurahan: "Darmo",
      kecamatan: "Wonokromo",
      kabupaten: "Surabaya",
      province: "Jawa Timur",
      latitude: -7.2575,
      longitude: 112.7521,
      phone: "6281234567890",
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });

  const hjShofiyah = await prisma.person.create({
    data: {
      fullName: "Hj. Shofiyah Salamah",
      gender: "FEMALE",
      isAlive: true,
      generationNumber: 4,
      familyBranch: "Cabang H. Noor",
      fatherId: hSaid.id,
      birthDate: "1958-12-03",
      country: "Indonesia",
      address: "Jl. Veteran No. 23",
      kelurahan: "Gapurosukolilo",
      kecamatan: "Gresik",
      kabupaten: "Gresik",
      province: "Jawa Timur",
      latitude: -7.1621,
      longitude: 112.6513,
      phone: "6281345678901",
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });

  const aliHamid = await prisma.person.create({
    data: {
      fullName: "Ali Hamid",
      gender: "MALE",
      isAlive: true,
      generationNumber: 4,
      familyBranch: "Cabang H. Thabri",
      fatherId: hAbdulHamid.id,
      birthPlace: "Jakarta",
      birthDate: "1960-09-01",
      country: "Indonesia",
      address: "Jl. Raya Bogor Km 25",
      kelurahan: "Ciracas",
      kecamatan: "Ciracas",
      kabupaten: "Jakarta Timur",
      province: "DKI Jakarta",
      latitude: -6.225,
      longitude: 106.9004,
      phone: "6281789012345",
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });
  console.log("   Gen 4: H. Abd. Rahman, H. Zubaidi, Hj. Shofiyah, Ali Hamid");

  // --- Generasi 5 ---
  const ahmadMuzanni = await prisma.person.create({
    data: {
      fullName: "Ahmad Muzanni",
      nickname: "Muzanni",
      gender: "MALE",
      isAlive: true,
      generationNumber: 5,
      familyBranch: "Cabang H. Noor",
      fatherId: hAbdRahman.id,
      birthPlace: "Jakarta",
      birthDate: "1978-06-15",
      country: "Indonesia",
      address: "Jl. Kemang Raya No. 5",
      kelurahan: "Bangka",
      kecamatan: "Mampang Prapatan",
      kabupaten: "Jakarta Selatan",
      province: "DKI Jakarta",
      latitude: -6.2615,
      longitude: 106.8106,
      phone: "6281456789012",
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });

  const sitiAminah = await prisma.person.create({
    data: {
      fullName: "Siti Aminah",
      nickname: "Aminah",
      gender: "FEMALE",
      isAlive: true,
      generationNumber: 5,
      familyBranch: "Cabang H. Noor",
      fatherId: hAbdRahman.id,
      birthPlace: "Jakarta",
      birthDate: "1982-01-20",
      country: "Indonesia",
      address: "Jl. BSD Raya Blok A2/10",
      kelurahan: "Lengkong Gudang",
      kecamatan: "Serpong",
      kabupaten: "Tangerang Selatan",
      province: "Banten",
      latitude: -6.1783,
      longitude: 106.6319,
      phone: "6281567890123",
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });

  const fatimah = await prisma.person.create({
    data: {
      fullName: "Fatimah Zubaidi",
      gender: "FEMALE",
      isAlive: true,
      generationNumber: 5,
      familyBranch: "Cabang H. Noor",
      fatherId: hZubaidi.id,
      birthPlace: "Surabaya",
      birthDate: "1985-04-10",
      country: "Indonesia",
      address: "Jl. Dharmahusada No. 12",
      kelurahan: "Mulyorejo",
      kecamatan: "Mulyorejo",
      kabupaten: "Surabaya",
      province: "Jawa Timur",
      latitude: -7.29,
      longitude: 112.75,
      phone: "6281678901234",
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });
  console.log("   Gen 5: Ahmad Muzanni, Siti Aminah, Fatimah Zubaidi");

  // --- Generasi 6 ---
  await prisma.person.create({
    data: {
      fullName: "Rizky Muzanni",
      nickname: "Rizky",
      gender: "MALE",
      isAlive: true,
      generationNumber: 6,
      familyBranch: "Cabang H. Noor",
      fatherId: ahmadMuzanni.id,
      birthPlace: "Jakarta",
      birthDate: "2005-03-12",
      country: "Indonesia",
      kabupaten: "Jakarta Selatan",
      province: "DKI Jakarta",
      latitude: -6.2615,
      longitude: 106.8106,
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });

  await prisma.person.create({
    data: {
      fullName: "Aisyah Muzanni",
      nickname: "Aisyah",
      gender: "FEMALE",
      isAlive: true,
      generationNumber: 6,
      familyBranch: "Cabang H. Noor",
      fatherId: ahmadMuzanni.id,
      birthPlace: "Jakarta",
      birthDate: "2008-07-28",
      country: "Indonesia",
      kabupaten: "Jakarta Selatan",
      province: "DKI Jakarta",
      latitude: -6.2615,
      longitude: 106.8106,
      linkStatus: "LINKED",
      status: "APPROVED",
    },
  });
  console.log("   Gen 6: Rizky Muzanni, Aisyah Muzanni");

  // --- Orphan (belum terhubung) ---
  await prisma.person.create({
    data: {
      fullName: "Budi Santoso",
      gender: "MALE",
      isAlive: true,
      generationNumber: 5,
      fatherNameFallback: "Pak Hasan bin Said",
      birthDate: "1988-05-15",
      country: "Indonesia",
      address: "Jl. Ijen No. 7",
      kelurahan: "Oro-oro Dowo",
      kecamatan: "Klojen",
      kabupaten: "Malang",
      province: "Jawa Timur",
      latitude: -7.9786,
      longitude: 112.6317,
      phone: "6282109876543",
      linkStatus: "UNLINKED",
      status: "APPROVED",
    },
  });
  console.log("   Orphan: Budi Santoso (belum terhubung)");

  // ============================================================
  // 3. MARRIAGES
  // ============================================================
  console.log("\n💍 Membuat data pernikahan...");

  await prisma.marriage.create({
    data: {
      husbandId: hZubaidi.id,
      wifeId: hjShofiyah.id,
      marriageDate: "1980-06-15",
      marriagePlace: "Bawean, Gresik",
      status: "MARRIED",
    },
  });

  await prisma.marriage.create({
    data: {
      husbandId: ahmadMuzanni.id,
      wifeId: sitiAminah.id,
      marriageDate: "2003-12-20",
      marriagePlace: "Jakarta",
      status: "MARRIED",
    },
  });
  console.log("   ✅ 2 pernikahan tercatat");

  // ============================================================
  // 4. ACTIVITY LOG (sample)
  // ============================================================
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: "Menjalankan seed database",
      target: "Sistem",
      metadata: { seedVersion: "1.0", timestamp: new Date().toISOString() },
    },
  });

  // ============================================================
  // SUMMARY
  // ============================================================
  const personCount = await prisma.person.count();
  const userCount = await prisma.user.count();
  const marriageCount = await prisma.marriage.count();

  console.log("\n" + "=".repeat(50));
  console.log("🎉 SEEDING SELESAI!");
  console.log("=".repeat(50));
  console.log(`   👤 Users     : ${userCount}`);
  console.log(`   🧑‍🤝‍🧑 Persons   : ${personCount}`);
  console.log(`   💍 Marriages : ${marriageCount}`);
  console.log("");
  console.log("📋 Akun Login:");
  console.log("   Admin  : admin@baniabdmutthalib.id / admin123");
  console.log("   Member : muzanni@email.com / member123");
  console.log("=".repeat(50));

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});
