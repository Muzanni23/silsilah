// ============================================================
// Types & Interfaces — Platform Silsilah Bani Abd. Mutthalib
// ============================================================

export enum Role {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum DataStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum MarriageStatus {
  MARRIED = "MARRIED",
  DIVORCED = "DIVORCED",
  WIDOWED = "WIDOWED",
}

export enum ChangeType {
  ADD = "ADD",
  EDIT = "EDIT",
  DELETE = "DELETE",
}

export enum LinkStatus {
  LINKED = "LINKED",
  UNLINKED = "UNLINKED",
}

// --------------------------------------------------
// Model Utama
// --------------------------------------------------

export interface Person {
  id: string;
  fullName: string;
  nickname?: string | null;
  gender: Gender;
  birthDate?: string | null;
  birthPlace?: string | null;
  deathDate?: string | null;
  deathPlace?: string | null;
  isAlive: boolean;
  photoUrl?: string | null;
  bio?: string | null;

  // Generasi
  generationNumber?: number | null;
  familyBranch?: string | null;

  // Domisili
  address?: string | null;       // Jalan / alamat lengkap
  kelurahan?: string | null;     // Kelurahan / Desa
  kecamatan?: string | null;     // Kecamatan
  kabupaten?: string | null;     // Kabupaten / Kota
  province?: string | null;      // Provinsi
  country?: string | null;       // Negara (default Indonesia)
  // Legacy alias (backward compat)
  village?: string | null;
  district?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  // Lokasi Makam (struktur sama)
  graveAddress?: string | null;       // Jalan / alamat makam
  graveKelurahan?: string | null;     // Kelurahan makam
  graveKecamatan?: string | null;     // Kecamatan makam
  graveKabupaten?: string | null;     // Kabupaten / Kota makam
  graveProvince?: string | null;      // Provinsi makam
  graveLatitude?: number | null;
  graveLongitude?: number | null;
  graveNotes?: string | null;
  // Legacy alias
  graveCity?: string | null;

  // Relasi
  fatherId?: string | null;
  motherId?: string | null;
  fatherNameFallback?: string | null;
  motherNameFallback?: string | null;

  // Kontak
  phone?: string | null;

  // Status
  linkStatus: LinkStatus;
  status: DataStatus;
  submittedById?: string;
  approvedById?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Marriage {
  id: string;
  husbandId: string;
  wifeId: string;
  marriageDate?: string;
  marriagePlace?: string;
  status: MarriageStatus;
  divorceDate?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  fatherName: string;
  motherName: string;
  linkedPersonId?: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PersonSubmission {
  id: string;
  submittedById: string;
  submittedByName: string;
  personData: Partial<Person>;
  changeType: ChangeType;
  targetPersonId?: string;
  targetPersonName?: string;
  status: DataStatus;
  adminNote?: string;
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// --------------------------------------------------
// Helpers untuk pohon keluarga
// --------------------------------------------------

export interface TreeNodeData {
  person: Person;
  spouses: Person[];
  childrenCount: number;
}

export interface FamilyStats {
  totalAnggota: number;
  totalHidup: number;
  totalWafat: number;
  totalGenerasi: number;
  totalCabang: number;
  pendingSubmissions: number;
  pendingUsers: number;
}
