import { onCleanup, onMount } from "solid-js";

export function useOrderEvents(onOrdersUpdated: () => void) {
  onMount(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const source = new EventSource("/api/events/orders");
    const handleOrdersUpdated = () => onOrdersUpdated();

    source.addEventListener("orders-updated", handleOrdersUpdated);

    onCleanup(() => {
      source.removeEventListener("orders-updated", handleOrdersUpdated);
      source.close();
    });
  });
}
