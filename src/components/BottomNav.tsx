import { A } from "@solidjs/router";
import { Component, For } from "solid-js";
import { useUser } from "~/lib/user-context";
import {
  IconHome,
  IconUtensilsCrossed,
  IconWallet,
  IconUser,
  IconChart,
  IconList,
} from "./icons";

interface NavItem {
  href: string;
  label: string;
  Icon: Component<{ class?: string }>;
  end?: boolean;
}

const pemesanNav: NavItem[] = [
  { href: "/", label: "Beranda", Icon: IconHome, end: true },
  { href: "/my-orders", label: "Pesanan", Icon: IconUtensilsCrossed },
  { href: "/orders/new", label: "Titip", Icon: IconList },
  { href: "/role", label: "Akun", Icon: IconUser },
];

const pembeliNav: NavItem[] = [
  { href: "/buyer/orders", label: "Order", Icon: IconHome, end: true },
  { href: "/buyer/recap", label: "Rekap", Icon: IconUtensilsCrossed },
  { href: "/buyer/settlement", label: "Tagihan", Icon: IconWallet },
  { href: "/role", label: "Akun", Icon: IconUser },
];

export default function BottomNav() {
  const { user } = useUser();

  const navItems = () => {
    const u = user();
    if (!u) return [] as NavItem[];
    return u.role === "pemesan" ? pemesanNav : pembeliNav;
  };

  return (
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div class="mx-auto flex max-w-lg items-end pb-safe">
        <For each={navItems()}>
          {(item) => (
            <A
              href={item.href}
              end={item.end}
              class="flex flex-1 flex-col items-center gap-0.5 py-2 text-gray-400 transition-colors"
              activeClass="!text-primary-600 [&>div]:bg-primary-100"
            >
              <div class="flex h-8 w-14 items-center justify-center rounded-full transition-colors">
                <item.Icon class="h-5 w-5" />
              </div>
              <span class="text-[10px] font-medium">{item.label}</span>
            </A>
          )}
        </For>
      </div>
    </nav>
  );
}
