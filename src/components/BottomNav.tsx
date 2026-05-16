import { A } from "@solidjs/router";
import { Component, For } from "solid-js";
import { useUser } from "~/lib/user-context";
import {
  IconHome,
  IconStore,
  IconPlus,
  IconList,
  IconClipboard,
  IconChart,
  IconWallet,
  IconMenu,
} from "./icons";

interface NavItem {
  href: string;
  label: string;
  Icon: Component<{ class?: string }>;
}

const pemesanNav: NavItem[] = [
  { href: "/", label: "Beranda", Icon: IconHome },
  { href: "/stores", label: "Toko", Icon: IconStore },
  { href: "/orders/new", label: "Titip", Icon: IconPlus },
  { href: "/my-orders", label: "Pesananku", Icon: IconList },
];

const pembeliNav: NavItem[] = [
  { href: "/buyer/orders", label: "Semua Order", Icon: IconClipboard },
  { href: "/buyer/recap", label: "Rekap", Icon: IconChart },
  { href: "/buyer/settlement", label: "Tagihan", Icon: IconWallet },
  { href: "/menus", label: "Menu", Icon: IconMenu },
];

export default function BottomNav() {
  const { user } = useUser();

  const navItems = () => {
    const u = user();
    if (!u) return [] as NavItem[];
    return u.role === "pemesan" ? pemesanNav : pembeliNav;
  };

  return (
    <nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
      <div class="mx-auto flex max-w-lg">
        <For each={navItems()}>
          {(item) => (
            <A
              href={item.href}
              class="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-gray-500 transition-colors"
              activeClass="!text-primary-600"
              end={item.href === "/"}
            >
              <item.Icon class="h-6 w-6" />
              <span class="text-xs font-medium">{item.label}</span>
            </A>
          )}
        </For>
      </div>
    </nav>
  );
}
