import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserInfo {
  username: string;
  token: string;
}

interface UserState {
  userInfo: UserInfo;
  setUser: (info: Partial<UserInfo>) => void;
  logout: () => void;
}

const initialUserInfo: UserInfo = { username: "", token: "" };

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: initialUserInfo,
      setUser: (info) =>
        set((s) => ({ userInfo: { ...s.userInfo, ...info } })),
      logout: () => set({ userInfo: initialUserInfo }),
    }),
    { name: "perya-user" },
  ),
);
