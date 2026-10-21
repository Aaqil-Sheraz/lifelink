import axios, { AxiosError } from "axios";
import type { BloodGroup, Donor, Donation, SOS, Urgency, User } from "../types";

export const SOCKET_URL: string = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000";
export const API_URL: string = import.meta.env.VITE_API_URL ?? `${SOCKET_URL}/api`;

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export interface RegisterBody {
  name: string;
  email: string;
  phone: string;
  password: string;
  bloodGroup: BloodGroup;
  locality: string;
  city: string;
  pincode: string;
}

export interface SOSBody {
  patientName: string;
  bloodGroupNeeded: BloodGroup;
  unitsNeeded: number;
  hospitalName: string;
  hospitalAddress: string;
  locality: string;
  urgency: Urgency;
  contactName?: string;
  contactPhone?: string;
  relation?: string;
}

export const authApi = {
  register: (body: RegisterBody) => api.post<{ token: string; user: User }>("/auth/register", body),
  login: (body: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>("/auth/login", body),
  me: () => api.get<{ user: User }>("/auth/me"),
};

export const donorApi = {
  list: (params: { bloodGroup?: string; compatibleWith?: string; locality?: string; available?: boolean; page?: number; limit?: number }) =>
    api.get<{ total: number; page: number; limit: number; donors: Donor[] }>("/donors", { params }),
  updateProfile: (body: Partial<Pick<User, "name" | "phone" | "bloodGroup" | "locality" | "city" | "pincode">>) =>
    api.put<{ user: User }>("/donors/profile", body),
  availability: () => api.patch<{ isAvailable: boolean }>("/donors/availability"),
  donated: (sosRequestId?: string) => api.patch<{ message: string; user: User }>("/donors/donated", { sosRequestId }),
  history: () => api.get<Donation[]>("/donors/history"),
};

export const sosApi = {
  create: (body: SOSBody) => api.post<{ sos: SOS; matchedDonors: number; alertedOnline?: number; compatibleGroups?: string[] }>("/sos", body),
  active: (params: { bloodGroup?: string; canDonate?: string; locality?: string }) => api.get<SOS[]>("/sos/active", { params }),
  mine: () => api.get<SOS[]>("/sos/mine"),
  get: (id: string) => api.get<SOS>(`/sos/${id}`),
  fulfill: (id: string) => api.patch<SOS>(`/sos/${id}/fulfill`),
  remove: (id: string) => api.delete(`/sos/${id}`),
};

export const adminApi = {
  stats: () => api.get<{ donors: number; verifiedDonors: number; activeSOS: number; fulfilled: number; expired: number }>("/admin/stats"),
  pending: () => api.get<Donor[]>("/admin/donors/pending"),
  verify: (id: string) => api.patch(`/admin/donors/${id}/verify`),
  sos: () => api.get<SOS[]>("/admin/sos"),
};
