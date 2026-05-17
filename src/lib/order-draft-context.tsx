import {
  createContext,
  createMemo,
  createSignal,
  onMount,
  ParentComponent,
  useContext,
} from "solid-js";

export interface DraftOrderItem {
  menuId: number;
  storeId: number;
  storeName: string;
  menuName: string;
  price: number;
  quantity: number;
  notes: string;
}

export interface DraftMenuInput {
  id: number;
  storeId: number;
  storeName: string;
  name: string;
  price: number;
}

interface OrderDraftContextValue {
  items: () => DraftOrderItem[];
  mounted: () => boolean;
  totalAmount: () => number;
  totalQuantity: () => number;
  totalStoreCount: () => number;
  getItem: (menuId: number) => DraftOrderItem | undefined;
  setQuantity: (menu: DraftMenuInput, quantity: number) => void;
  setItemNotes: (menuId: number, notes: string) => void;
  removeItem: (menuId: number) => void;
  clearDraft: () => void;
}

const OrderDraftContext = createContext<OrderDraftContextValue>();
const STORAGE_KEY = "titip_makan_order_draft";

export const OrderDraftProvider: ParentComponent = (props) => {
  const [items, setItems] = createSignal<DraftOrderItem[]>([]);
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore malformed local storage
    }
    setMounted(true);
  });

  const persist = (nextItems: DraftOrderItem[]) => {
    setItems(nextItems);
    try {
      if (nextItems.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage failures
    }
  };

  const totalAmount = createMemo(() =>
    items().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  const totalQuantity = createMemo(() =>
    items().reduce((sum, item) => sum + item.quantity, 0),
  );
  const totalStoreCount = createMemo(
    () => new Set(items().map((item) => item.storeId)).size,
  );

  const getItem = (menuId: number) =>
    items().find((item) => item.menuId === menuId);

  const setQuantity = (menu: DraftMenuInput, quantity: number) => {
    if (quantity <= 0) {
      persist(items().filter((item) => item.menuId !== menu.id));
      return;
    }

    const existing = getItem(menu.id);
    if (!existing) {
      persist([
        ...items(),
        {
          menuId: menu.id,
          storeId: menu.storeId,
          storeName: menu.storeName,
          menuName: menu.name,
          price: menu.price,
          quantity,
          notes: "",
        },
      ]);
      return;
    }

    persist(
      items().map((item) =>
        item.menuId === menu.id ? { ...item, quantity } : item,
      ),
    );
  };

  const setItemNotes = (menuId: number, notes: string) => {
    persist(
      items().map((item) => (item.menuId === menuId ? { ...item, notes } : item)),
    );
  };

  const removeItem = (menuId: number) => {
    persist(items().filter((item) => item.menuId !== menuId));
  };

  const clearDraft = () => {
    persist([]);
  };

  return (
    <OrderDraftContext.Provider
      value={{
        items,
        mounted,
        totalAmount,
        totalQuantity,
        totalStoreCount,
        getItem,
        setQuantity,
        setItemNotes,
        removeItem,
        clearDraft,
      }}
    >
      {props.children}
    </OrderDraftContext.Provider>
  );
};

export const useOrderDraft = () => {
  const ctx = useContext(OrderDraftContext);
  if (!ctx) {
    throw new Error("useOrderDraft must be used within OrderDraftProvider");
  }
  return ctx;
};
