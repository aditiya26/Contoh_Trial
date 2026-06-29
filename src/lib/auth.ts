import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "operator" | "viewer";

export interface User {
  id: string;
  username: string;
  name: string;
  password: string; // local-only; simple stored hash via btoa for demo
  role: Role;
  createdAt: string;
}

interface AuthState {
  users: User[];
  currentUserId: string | null;
  init: () => void;
  login: (username: string, password: string) => User | null;
  logout: () => void;
  addUser: (u: Omit<User, "id" | "createdAt">) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  removeUser: (id: string) => void;
}

const enc = (p: string) => btoa(unescape(encodeURIComponent(p)));

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUserId: null,
      init: () => {
        if (get().users.length === 0) {
          set({
            users: [
              {
                id: "u_admin",
                username: "admin",
                name: "Administrator",
                password: enc("admin"),
                role: "admin",
                createdAt: new Date().toISOString(),
              },
            ],
          });
        }
      },
      login: (username, password) => {
        const u = get().users.find(
          (x) => x.username.toLowerCase() === username.toLowerCase() && x.password === enc(password),
        );
        if (u) {
          set({ currentUserId: u.id });
          return u;
        }
        return null;
      },
      logout: () => set({ currentUserId: null }),
      addUser: (u) =>
        set((s) => ({
          users: [
            ...s.users,
            { ...u, password: enc(u.password), id: "u_" + Math.random().toString(36).slice(2, 9), createdAt: new Date().toISOString() },
          ],
        })),
      updateUser: (id, patch) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id
              ? { ...u, ...patch, password: patch.password ? enc(patch.password) : u.password }
              : u,
          ),
        })),
      removeUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
    }),
    { name: "adsan-erp-auth", version: 1 },
  ),
);

export const useCurrentUser = () => {
  const { users, currentUserId } = useAuth();
  return users.find((u) => u.id === currentUserId) ?? null;
};