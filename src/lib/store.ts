import { create } from "zustand";
import { authClient } from "./auth-client";

// Types mirroring the Prisma schema
interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  phone?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  linkedPersonId?: string | null;
  role: string;
  status: string;
}

interface AppState {
  // Auth (Better Auth)
  currentUser: UserData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;

  // Untuk demo mode (tanpa database)
  demoMode: boolean;
  setDemoMode: (on: boolean) => void;
  loginAsDemo: (role: "admin" | "member") => void;

  // Pohon keluarga
  selectedPersonId: string | null;
  setSelectedPersonId: (id: string | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Demo users (fallback ketika tidak ada database)
const demoUsers: Record<string, UserData> = {
  admin: {
    id: "demo-admin",
    name: "Admin Utama",
    email: "admin@baniabdmutthalib.id",
    phone: "6281000000001",
    fatherName: "H. Abd. Rahman",
    motherName: "Siti Khadijah",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
  },
  member: {
    id: "demo-member",
    name: "Ahmad Muzanni",
    email: "muzanni@email.com",
    phone: "6281456789012",
    fatherName: "H. Abd. Rahman",
    motherName: "Siti Khadijah",
    role: "MEMBER",
    status: "ACTIVE",
  },
};

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  isLoggedIn: false,
  isLoading: true,
  demoMode: false,

  checkSession: async () => {
    try {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        const user = session.data.user as unknown as UserData;
        set({ currentUser: user, isLoggedIn: true, isLoading: false });
      } else {
        set({ currentUser: null, isLoggedIn: false, isLoading: false });
      }
    } catch {
      // Jika Better Auth tidak tersedia (no DB), aktifkan demo mode
      set({ isLoading: false, demoMode: true });
    }
  },

  logout: async () => {
    if (get().demoMode) {
      set({ currentUser: null, isLoggedIn: false });
      return;
    }
    try {
      await authClient.signOut();
    } catch {
      // ignore
    }
    set({ currentUser: null, isLoggedIn: false });
  },

  setDemoMode: (on) => set({ demoMode: on }),

  loginAsDemo: (role) => {
    const user = demoUsers[role];
    set({ currentUser: user, isLoggedIn: true, demoMode: true });
  },

  selectedPersonId: null,
  setSelectedPersonId: (id) => set({ selectedPersonId: id }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
