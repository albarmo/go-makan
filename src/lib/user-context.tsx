import {
  createContext,
  useContext,
  createSignal,
  onMount,
  ParentComponent,
} from "solid-js";

export type Role = "pemesan" | "pembeli";

export interface UserState {
  id: number;
  username: string;
  role: Role;
  name: string;
  hasCompletedSetup: boolean;
  bankName?: string;
  accountNumber?: string;
  cardholderName?: string;
}

interface UserContextValue {
  user: () => UserState | null;
  mounted: () => boolean;
  setUser: (state: UserState | null) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextValue>();

const STORAGE_KEY = "titip_makan_user";

function isValidStoredUser(value: unknown): value is UserState {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<UserState>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.username === "string" &&
    (candidate.role === "pemesan" || candidate.role === "pembeli") &&
    typeof candidate.name === "string" &&
    typeof candidate.hasCompletedSetup === "boolean"
  );
}

export const UserProvider: ParentComponent = (props) => {
  const [user, setUserSignal] = createSignal<UserState | null>(null);
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isValidStoredUser(parsed)) {
          setUserSignal(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
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
