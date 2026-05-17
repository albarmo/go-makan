import { Title } from "@solidjs/meta";
import { A, createAsync } from "@solidjs/router";
import {
  ArrowRight as IconArrowRight,
  Copy as IconCopy,
  Wallet as IconWallet,
} from "lucide-solid";
import { createMemo, createSignal, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { formatRupiah } from "~/lib/utils";
import { getSettlement } from "~/server/orders";

export const route = {
  load: () => getSettlement(),
};

type SettlementPerson = Awaited<ReturnType<typeof getSettlement>>[number];

export default function BuyerSettlementPage() {
  return (
    <RoleGuard requiredRole="pembeli">
      <BuyerSettlementContent />
    </RoleGuard>
  );
}

function BuyerSettlementContent() {
  const settlement = createAsync(() => getSettlement());
  const [copiedState, setCopiedState] = createSignal<string | null>(null);

  const grandTotal = createMemo(() =>
    (settlement() ?? []).reduce((sum, person) => sum + person.totalAmount, 0),
  );
  const unpaidTotal = createMemo(() =>
    (settlement() ?? [])
      .flatMap((person) => person.orderGroups)
      .filter((order) => order.paymentStatus !== "paid")
      .reduce((sum, order) => sum + order.orderTotal, 0),
  );
  const paidTotal = createMemo(() =>
    (settlement() ?? [])
      .flatMap((person) => person.orderGroups)
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + order.orderTotal, 0),
  );
  const unpaidPeopleCount = createMemo(
    () =>
      (settlement() ?? []).filter((person) =>
        person.orderGroups.some((group) => group.paymentStatus !== "paid"),
      ).length,
  );

  const setCopied = (message: string) => {
    setCopiedState(message);
    window.setTimeout(() => setCopiedState(null), 1800);
  };

  const copyText = async (text: string, message: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    setCopied(message);
  };

  const buildPersonSummary = (person: SettlementPerson) =>
    [
      `Tagihan ${person.requesterName}`,
      ...person.orderGroups.map((group) => {
        const items = group.items
          .map(
            (item) =>
              `${item.quantity}x ${item.menuName} - ${item.storeName} (${formatRupiah(item.subtotal)})`,
          )
          .join(", ");
        return `- ${group.storeSummary}: ${items} | Total ${formatRupiah(group.orderTotal)} | ${group.paymentStatus === "paid" ? "Lunas" : "Belum Bayar"}`;
      }),
      `Total: ${formatRupiah(person.totalAmount)}`,
    ].join("\n");

  const buildAllSummary = () =>
    [
      "Rincian Tagihan Hari Ini",
      `Total Tagihan: ${formatRupiah(grandTotal())}`,
      `Belum Lunas: ${formatRupiah(unpaidTotal())}`,
      `Lunas: ${formatRupiah(paidTotal())}`,
      "",
      ...(settlement() ?? []).map((person) => buildPersonSummary(person)),
    ].join("\n");

  return (
    <>
      <Title>Tagihan - Titip Makan</Title>
      <Layout title="Tagihan" showBack>
        <section class="space-y-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h1 class="tm-page-title">Tagihan</h1>
              <p class="mt-2 text-base text-slate-500">
                Pantau pemesan yang sudah transfer dan siapa yang masih perlu ditagih.
              </p>
            </div>
            <A
              href="/buyer/orders"
              class="text-base font-semibold text-primary-700"
            >
              Lihat Orders
            </A>
          </div>

          <div class="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#35bced] via-cyan-400 to-sky-500 px-6 py-6 text-primary-800 shadow-[0_18px_36px_rgba(53,188,237,0.2)]">
            <div class="absolute -left-10 top-12 h-24 w-24 rounded-lg bg-white/10" />
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-lg bg-white/10" />
            <div class="relative z-10">
              <p class="text-sm text-center text-primary-700">
                Total Tagihan ({(settlement() ?? []).length} Pemesan)
              </p>
              <p class="mt-3 text-center font-bold tracking-[-0.06em]">
                {formatRupiah(grandTotal())}
              </p>

              <div class="mt-5 grid grid-cols-3 gap-3">
                <SettlementStat label="Belum Lunas" value={formatRupiah(unpaidTotal())} />
                <SettlementStat label="Lunas" value={formatRupiah(paidTotal())} />
                <SettlementStat label="Perlu Tagih" value={String(unpaidPeopleCount())} />
              </div>
            </div>
          </div>

          <Show when={copiedState()}>
            <div class="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {copiedState()}
            </div>
          </Show>

          <div class="flex items-end justify-between gap-4">
            <h2 class="font-bold tracking-[-0.05em] text-slate-900">
              Rincian per Pemesan
            </h2>
            <button
              type="button"
              class="text-base font-semibold text-primary-700"
              onClick={() =>
                void copyText(buildAllSummary(), "Rincian tagihan berhasil disalin.")
              }
            >
              Salin Semua
            </button>
          </div>

          <Suspense fallback={<SettlementSkeleton />}>
            <Show
              when={(settlement() ?? []).length > 0}
              fallback={
                <div class="tm-card p-8">
                  <p class="text-slate-600">Belum ada tagihan hari ini.</p>
                </div>
              }
            >
              <div class="space-y-6">
                <For each={settlement()}>
                  {(person) => {
                    const unpaidAmount = person.orderGroups
                      .filter((group) => group.paymentStatus !== "paid")
                      .reduce((sum, group) => sum + group.orderTotal, 0);
                    const paidAmount = person.orderGroups
                      .filter((group) => group.paymentStatus === "paid")
                      .reduce((sum, group) => sum + group.orderTotal, 0);
                    const actionGroup =
                      person.orderGroups.find(
                        (group) => group.paymentStatus !== "paid",
                      ) ?? person.orderGroups[0];

                    return (
                      <div class="tm-card p-5">
                        <div class="flex items-start justify-between gap-4">
                          <div class="flex items-start gap-4">
                            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 font-semibold text-primary-700">
                              {person.requesterName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p class="font-semibold leading-tight tracking-[-0.05em] text-slate-900">
                                {person.requesterName}
                              </p>
                              <p class="mt-1 text-sm text-slate-500">
                                {person.orderGroups.length} order •{" "}
                                {person.orderGroups[0]?.storeSummary ?? "-"}
                              </p>
                            </div>
                          </div>
                          <span
                            class={
                              unpaidAmount > 0
                                ? "badge-cancelled"
                                : "badge-purchased"
                            }
                          >
                            {unpaidAmount > 0 ? "Belum Bayar" : "Lunas"}
                          </span>
                        </div>

                        <div class="mt-4 grid grid-cols-2 gap-3">
                          <div class="rounded-lg bg-slate-50 px-4 py-4">
                            <p class="text-sm text-slate-500">Belum Lunas</p>
                            <p class="mt-2 font-semibold text-slate-900">
                              {formatRupiah(unpaidAmount)}
                            </p>
                          </div>
                          <div class="rounded-lg bg-slate-50 px-4 py-4">
                            <p class="text-sm text-slate-500">Sudah Lunas</p>
                            <p class="mt-2 font-semibold text-slate-900">
                              {formatRupiah(paidAmount)}
                            </p>
                          </div>
                        </div>

                        <div class="mt-4 space-y-3">
                          <For each={person.orderGroups}>
                            {(group) => (
                              <div class="rounded-lg bg-slate-50 px-4 py-4">
                                <div class="flex items-start justify-between gap-4">
                                  <div>
                                    <p class="font-semibold text-slate-900">
                                      {group.storeSummary}
                                    </p>
                                    <p class="mt-1 text-sm text-slate-500">
                                      {group.items.length} item • {group.storeCount} toko
                                    </p>
                                  </div>
                                  <span
                                    class={
                                      group.paymentStatus === "paid"
                                        ? "badge-purchased"
                                        : "badge-submitted"
                                    }
                                  >
                                    {group.paymentStatus === "paid"
                                      ? "Lunas"
                                      : "Belum Bayar"}
                                  </span>
                                </div>

                                <div class="mt-3 space-y-2">
                                  <For each={group.items}>
                                    {(item) => (
                                      <div class="flex items-start justify-between gap-3 text-sm text-slate-700">
                                        <p>
                                          {item.quantity}x {item.menuName}
                                          <span class="text-slate-400"> • {item.storeName}</span>
                                        </p>
                                        <p>{formatRupiah(item.subtotal)}</p>
                                      </div>
                                    )}
                                  </For>
                                </div>

                                <div class="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                                  <p class="text-sm text-slate-500">Total Order</p>
                                  <p class="font-semibold text-primary-700">
                                    {formatRupiah(group.orderTotal)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>

                        <div class="mt-4 flex items-center justify-between gap-4">
                          <div>
                            <p class="text-sm text-slate-500">
                              Total {person.requesterName}
                            </p>
                            <p class="mt-1 font-bold tracking-[-0.05em] text-slate-900">
                              {formatRupiah(person.totalAmount)}
                            </p>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              class="btn-secondary !min-h-0 gap-2 px-4 py-3"
                              onClick={() =>
                                void copyText(
                                  buildPersonSummary(person),
                                  `Ringkasan ${person.requesterName} berhasil disalin.`,
                                )
                              }
                            >
                              <IconCopy class="h-4 w-4" />
                              Salin
                            </button>
                            <A
                              href={`/orders/${actionGroup.orderId}`}
                              class="btn-primary !min-h-0 gap-2 px-4 py-3"
                            >
                              Detail
                              <IconArrowRight class="h-4 w-4" />
                            </A>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Show>
          </Suspense>
        </section>
      </Layout>
    </>
  );
}

function SettlementStat(props: { label: string; value: string }) {
  return (
    <div class="rounded-lg bg-white/18 px-3 py-3 text-center backdrop-blur-sm">
      <p class="text-sm text-primary-700/90">{props.label}</p>
      <p class="mt-1 font-semibold text-primary-800">{props.value}</p>
    </div>
  );
}

function SettlementSkeleton() {
  return (
    <div class="space-y-6">
      {[1, 2].map((item) => (
        <div class="h-80 animate-pulse rounded-lg bg-white/80" />
      ))}
    </div>
  );
}
