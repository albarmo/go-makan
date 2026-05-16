import { createAsync } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { createMemo, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { IconCalendar, IconCopy, IconFilter } from "~/components/icons";
import { getSettlement } from "~/server/orders";
import { formatRupiah } from "~/lib/utils";

export const route = {
  load: () => getSettlement(),
};

export default function BuyerSettlementPage() {
  return (
    <RoleGuard requiredRole="pembeli">
      <BuyerSettlementContent />
    </RoleGuard>
  );
}

function BuyerSettlementContent() {
  const settlement = createAsync(() => getSettlement());
  const grandTotal = createMemo(() =>
    (settlement() ?? []).reduce((sum, person) => sum + person.totalAmount, 0)
  );
  const unpaidTotal = createMemo(() =>
    (settlement() ?? [])
      .flatMap((person) => person.orderGroups)
      .filter((order) => order.status !== "purchased")
      .reduce((sum, order) => sum + order.orderTotal, 0)
  );
  const paidTotal = createMemo(() =>
    (settlement() ?? [])
      .flatMap((person) => person.orderGroups)
      .filter((order) => order.status === "purchased")
      .reduce((sum, order) => sum + order.orderTotal, 0)
  );

  return (
    <>
      <Title>Tagihan - Titip Makan</Title>
      <Layout title="Tagihan" showBack>
        <section class="space-y-7">
          <div class="tm-panel flex items-center justify-between">
            <div class="flex items-center gap-4 text-primary-700">
              <IconCalendar class="h-7 w-7" />
              <span class="text-lg font-semibold">Hari Ini</span>
            </div>
            <button type="button" class="text-lg font-semibold text-primary-700">
              Ubah
            </button>
          </div>

          <div class="relative overflow-hidden rounded-[2rem] bg-[#35bced] px-8 py-8 text-primary-800 shadow-[0_18px_36px_rgba(53,188,237,0.2)]">
            <div class="absolute -left-10 top-16 h-28 w-28 rounded-full bg-white/10" />
            <div class="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
            <p class="text-center text-lg">Total Tagihan ({(settlement() ?? []).length} Pemesan)</p>
            <p class="mt-3 text-center text-xl font-bold tracking-[-0.06em]">
              {formatRupiah(grandTotal())}
            </p>
            <div class="mt-5 flex justify-center gap-3">
              <span class="rounded-full bg-white/20 px-5 py-2 text-base">
                Belum Lunas: {formatRupiah(unpaidTotal())}
              </span>
              <span class="rounded-full bg-white/20 px-5 py-2 text-base">
                Lunas: {formatRupiah(paidTotal())}
              </span>
            </div>
          </div>

          <h2 class="text-xl font-bold tracking-[-0.05em] text-slate-900">
            Rincian per Pemesan
          </h2>

          <Suspense fallback={<SettlementSkeleton />}>
            <Show
              when={(settlement() ?? []).length > 0}
              fallback={
                <div class="tm-card p-8">
                  <p class="text-lg text-slate-600">Belum ada tagihan hari ini.</p>
                </div>
              }
            >
              <div class="space-y-6">
                <For each={settlement()}>
                  {(person) => {
                    const unpaidAmount = person.orderGroups
                      .filter((group) => group.status !== "purchased")
                      .reduce((sum, group) => sum + group.orderTotal, 0);
                    const paidAmount = person.orderGroups
                      .filter((group) => group.status === "purchased")
                      .reduce((sum, group) => sum + group.orderTotal, 0);

                    return (
                      <div class="tm-card p-6">
                        <div class="mb-5 flex items-start justify-between gap-4">
                          <div class="flex items-start gap-4">
                            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-primary-700">
                              {person.requesterName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p class="text-xl font-semibold leading-tight tracking-[-0.05em] text-slate-900">
                                {person.requesterName}
                              </p>
                              <p class="mt-1 text-lg text-primary-700">
                                {person.orderGroups[0]?.storeName ?? "-"}
                              </p>
                            </div>
                          </div>
                          <span class={unpaidAmount > 0 ? "badge-cancelled" : "badge-purchased"}>
                            {unpaidAmount > 0 ? "Belum Bayar" : "Lunas"}
                          </span>
                        </div>

                        <div class="space-y-4">
                          <For each={person.orderGroups}>
                            {(group) => (
                              <div class="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                                <For each={group.items}>
                                  {(item) => (
                                    <div class="mb-3 flex items-start justify-between gap-3 last:mb-0">
                                      <div>
                                        <p class="text-lg text-slate-900">
                                          {item.quantity}x {item.menuName}
                                        </p>
                                        <p class="mt-1 text-base text-primary-700">
                                          + Ongkir &amp; Biaya Layanan
                                        </p>
                                      </div>
                                      <div class="text-right">
                                        <p class="text-lg text-slate-900">{formatRupiah(item.subtotal)}</p>
                                        <p class="mt-1 text-base text-primary-700">Rp 7.500</p>
                                      </div>
                                    </div>
                                  )}
                                </For>
                              </div>
                            )}
                          </For>
                        </div>

                        <div class="mt-5 flex items-center justify-between gap-4">
                          <div>
                            <p class="text-xl text-slate-700">Total {person.requesterName}</p>
                            <Show when={paidAmount > 0 && unpaidAmount > 0}>
                              <p class="mt-1 text-sm text-slate-500">
                                Lunas {formatRupiah(paidAmount)}
                              </p>
                            </Show>
                          </div>
                          <p class="text-xl font-medium tracking-[-0.05em] text-primary-700">
                            {formatRupiah(person.totalAmount)}
                          </p>
                        </div>

                        <div class="mt-6 grid grid-cols-2 gap-4">
                          <button type="button" class="btn-secondary gap-3">
                            <IconFilter class="h-5 w-5" />
                            Ingatkan
                          </button>
                          <button type="button" class="btn-primary">Tandai Lunas</button>
                        </div>
                      </div>
                    );
                  }}
                </For>

                <button type="button" class="btn-outline w-full gap-3">
                  <IconCopy class="h-6 w-6" />
                  Salin Rincian Tagihan
                </button>
              </div>
            </Show>
          </Suspense>
        </section>
      </Layout>
    </>
  );
}

function SettlementSkeleton() {
  return (
    <div class="space-y-6">
      {[1, 2].map((item) => (
        <div class="h-80 animate-pulse rounded-[2rem] bg-white/80" />
      ))}
    </div>
  );
}
