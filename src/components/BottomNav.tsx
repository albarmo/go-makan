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
    href: "/settlement",
    label: "Tagihan",
    Icon: IconWallet,
    matches: ["/settlement"],
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
      <div class="grid grid-cols-4 gap-1.5 rounded-lg border border-white/80 bg-white/90 p-1.5 shadow-[0_-8px_24px_rgba(15,68,93,0.07)] backdrop-blur">
        <For each={navItems()}>
          {(item) => {
            const active = () => isActive(item);

            return (
              <A
                href={item.href}
                class={`flex min-h-[3.7rem] flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-1.5 text-center transition-all ${
                  active()
                    ? "bg-gradient-to-b from-sky-100 to-cyan-50 text-primary-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-primary-700"
                }`}
              >
                <span
                  class={`h-1 w-6 rounded-lg transition-all ${
                    active() ? "bg-primary-700/70" : "bg-transparent"
                  }`}
                />
                <div
                  class={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                    active() ? "bg-white text-primary-700" : "text-current"
                  }`}
                >
                  <item.Icon class="h-4 w-4" />
                </div>
                <span
                  class={`text-xs font-semibold leading-none ${
                    active() ? "text-primary-700" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </A>
            );
          }}
        </For>
      </div>
    </nav>
  );
}
