import {
  createContext,
  useContext,
  createSignal,
  onMount,
  ParentComponent,
} from "solid-js";

export type Role = "pemesan" | "pembeli";

export interface UserState {
  role: Role;
  name: string;
}

interface UserContextValue {
  user: () => UserState | null;
  mounted: () => boolean;
  setUser: (state: UserState | null) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextValue>();

const STORAGE_KEY = "titip_makan_user";

export const UserProvider: ParentComponent = (props) => {
  const [user, setUserSignal] = createSignal<UserState | null>(null);
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUserSignal(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setMounted(true);
  });

  const setUser = (state: UserState | null) => {
    setUserSignal(state);
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearUser = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, mounted, setUser, clearUser }}>
      {props.children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};
