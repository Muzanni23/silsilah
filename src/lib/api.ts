/**
 * Data Service Layer — Silsilah Bani Abd. Mutthalib
 *
 * Murni mengambil data dari Supabase via API Routes Next.js.
 */

import type { Person, Marriage, User, PersonSubmission, ActivityLog } from "./types";
import { DataStatus, LinkStatus } from "./types";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let errMessage = `Error ${res.status}`;
    try {
      const errorJson = await res.json();
      errMessage = errorJson.message || errMessage;
    } catch {
      // Ignore
    }
    throw new Error(errMessage);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

// ============================================================
// Persons
// ============================================================

export async function fetchPersons(filters?: {
  search?: string;
  generation?: number;
  branch?: string;
  linkStatus?: string;
  limit?: number;
}): Promise<Person[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.generation) params.set("generation", String(filters.generation));
  if (filters?.branch) params.set("branch", filters.branch);
  if (filters?.linkStatus) params.set("linkStatus", filters.linkStatus);
  if (filters?.limit) params.set("limit", String(filters.limit));

  return apiFetch<Person[]>(`/api/persons?${params}`);
}

export async function fetchPersonById(id: string): Promise<Person | null> {
  try {
    return await apiFetch<Person>(`/api/persons/${id}`);
  } catch {
    return null;
  }
}

export async function updatePerson(id: string, data: Record<string, unknown>): Promise<Person> {
  return apiFetch<Person>(`/api/persons/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function createPerson(data: Record<string, unknown>): Promise<Person> {
  return apiFetch<Person>("/api/persons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deletePerson(id: string): Promise<boolean> {
  try {
    await apiFetch(`/api/persons/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

export async function fetchLinkedPersons(): Promise<Person[]> {
  return apiFetch<Person[]>("/api/persons?linkStatus=LINKED&status=APPROVED");
}

export async function fetchOrphanPersons(): Promise<Person[]> {
  return apiFetch<Person[]>("/api/persons?linkStatus=UNLINKED");
}

// ============================================================
// Submissions
// ============================================================

export async function fetchSubmissions(filters?: {
  status?: string;
  userId?: string;
}): Promise<PersonSubmission[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  return apiFetch<PersonSubmission[]>(`/api/submissions?${params}`);
}

export async function createSubmission(data: {
  personData: Record<string, unknown>;
  changeType: string;
  targetPersonId?: string;
  targetPersonName?: string;
}): Promise<PersonSubmission> {
  return apiFetch<PersonSubmission>("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function reviewSubmission(
  id: string,
  action: "APPROVED" | "REJECTED",
  adminNote?: string
): Promise<boolean> {
  try {
    await apiFetch(`/api/submissions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote }),
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Users
// ============================================================

export async function fetchUsers(filters?: { status?: string }): Promise<User[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  return apiFetch<User[]>(`/api/users?${params}`);
}

export async function manageUser(id: string, action: string): Promise<boolean> {
  try {
    await apiFetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Marriages & Activity Logs
// ============================================================

export async function fetchMarriages(): Promise<Marriage[]> {
  return apiFetch<Marriage[]>("/api/marriages");
}

export async function fetchActivityLogs(): Promise<ActivityLog[]> {
  return apiFetch<ActivityLog[]>("/api/activity-log");
}

// ============================================================
// Statistics
// ============================================================

export async function fetchStats() {
  try {
    return await apiFetch<Record<string, unknown>>("/api/stats");
  } catch {
    return {
      totalAnggota: 0,
      masihHidup: 0,
      wafat: 0,
      orphanCount: 0,
      pendingSubmissions: 0,
      pendingUsers: 0,
      totalUsers: 0,
      totalGenerations: 0,
      totalBranches: 0,
      branches: [],
    };
  }
}

export async function claimProfile(personId: string): Promise<boolean> {
  try {
    await apiFetch(`/api/profile/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId }),
    });
    return true;
  } catch {
    return false;
  }
}
