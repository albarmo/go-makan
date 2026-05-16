import { A, useLocation } from "@solidjs/router";
import { Component, For } from "solid-js";
import { useUser } from "~/lib/user-context";
import { IconHome, IconUser, IconUtensilsCrossed, IconWallet } from "./icons";

interface NavItem {
  href: string;
  label: string;
  Icon: Component<{ class?: string }>;
  matches: string[];
}

const pemesanNav: NavItem[] = [
  { href: "/", label: "Home", Icon: IconHome, matches: ["/", "/stores"] },
  {
    href: "/my-orders",
    label: "Orders",
    Icon: IconUtensilsCrossed,
    matches: ["/my-orders", "/menus", "/orders/new", "/orders/"],
  },
  {
    href: "/stores",
    label: "Wallet",
    Icon: IconWallet,
    matches: ["/stores/new", "/stores/"],
  },
  { href: "/role", label: "Account", Icon: IconUser, matches: ["/role"] },
];

const pembeliNav: NavItem[] = [
  { href: "/", label: "Home", Icon: IconHome, matches: ["/"] },
  {
    href: "/buyer/orders",
    label: "Orders",
    Icon: IconUtensilsCrossed,
    matches: ["/buyer/orders", "/buyer/recap", "/orders/"],
  },
  {
    href: "/buyer/settlement",
    label: "Wallet",
    Icon: IconWallet,
    matches: ["/buyer/settlement"],
  },
  { href: "/role", label: "Account", Icon: IconUser, matches: ["/role"] },
];

export default function BottomNav() {
  const { user } = useUser();
  const location = useLocation();

  const navItems = () => (user()?.role === "pembeli" ? pembeliNav : pemesanNav);
  const pathname = () => location.pathname;

  const isActive = (item: NavItem) =>
    item.matches.some((match) =>
      match.endsWith("/") ? pathname().startsWith(match) : pathname() === match,
    );

  return (
    <nav class="tm-bottom-nav">
      <div class="mx-auto flex max-w-[30rem] items-end justify-between px-6 pb-5 pt-3">
        <For each={navItems()}>
          {(item) => (
            <A
              href={item.href}
              class="flex min-w-[4.5rem] flex-col items-center gap-1 text-primary-700/90"
            >
              <div
                class={`flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.5rem] transition-all ${
                  isActive(item)
                    ? "bg-[#74e0f7] text-primary-700 shadow-sm"
                    : "text-primary-700"
                }`}
              >
                <item.Icon class="h-7 w-7" />
              </div>
            </A>
          )}
        </For>
      </div>
    </nav>
  );
}
