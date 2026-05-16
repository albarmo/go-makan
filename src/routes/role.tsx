import { Title } from "@solidjs/meta";
import { createAsync, useAction, useNavigate } from "@solidjs/router";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import {
  IconArrowRight,
  IconCheckCircle,
  IconCircle,
  IconStore,
  IconUser,
  IconUtensilsCrossed,
  IconWallet,
} from "~/components/icons";
import { Role, useUser } from "~/lib/user-context";
import {
  getBuyerProfileByName,
  upsertUserProfileAction,
} from "~/server/profiles";

const roleHighlights = [
  "Nitip makan siang lebih cepat",
  "Bantu teman kantor belanja",
  "Ringkas order dan tagihan harian",
];

export default function RolePage() {
  const navigate = useNavigate();
  const { setUser, user } = useUser();
  const saveProfile = useAction(upsertUserProfileAction);
  const currentUser = () => user();
  const [selectedRole, setSelectedRole] = createSignal<Role | null>(
    currentUser()?.role ?? null,
  );
  const [name, setName] = createSignal(currentUser()?.name ?? "");
  const [bankName, setBankName] = createSignal(currentUser()?.bankName ?? "");
  const [accountNumber, setAccountNumber] = createSignal(
    currentUser()?.accountNumber ?? "",
  );
  const [cardholderName, setCardholderName] = createSignal(
    currentUser()?.cardholderName ?? currentUser()?.name ?? "",
  );
  const [error, setError] = createSignal("");
  const buyerProfile = createAsync(() =>
    selectedRole() === "pembeli" && name().trim().length > 1
      ? getBuyerProfileByName(name().trim())
      : null,
  );
  const selectedRoleLabel = createMemo(() =>
    selectedRole() === "pemesan"
      ? "Saya Nitip Makan"
      : selectedRole() === "pembeli"
        ? "Saya Yang Belikan"
        : "Pilih peranmu",
  );

  createEffect(() => {
    const profile = buyerProfile();
    if (selectedRole() !== "pembeli" || !profile) return;

    setBankName(profile.bankName ?? "");
    setAccountNumber(profile.accountNumber ?? "");
    setCardholderName(profile.cardholderName ?? name().trim());
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const role = selectedRole();
    const trimmedName = name().trim();
    const trimmedBankName = bankName().trim();
    const trimmedAccountNumber = accountNumber().trim();
    const trimmedCardholderName = cardholderName().trim();

    if (!trimmedName) {
      setError("Nama panggilan tidak boleh kosong.");
      return;
    }

    if (!role) {
      setError("Pilih peranmu dulu ya.");
      return;
    }

    if (role === "pembeli") {
      if (!trimmedBankName || !trimmedAccountNumber || !trimmedCardholderName) {
        setError("Lengkapi data rekening untuk role yang belikan ya.");
        return;
      }
    }

    const formData = new FormData();
    formData.set("role", role);
    formData.set("name", trimmedName);
    formData.set("bankName", role === "pembeli" ? trimmedBankName : "");
    formData.set(
      "accountNumber",
      role === "pembeli" ? trimmedAccountNumber : "",
    );
    formData.set(
      "cardholderName",
      role === "pembeli" ? trimmedCardholderName : "",
    );

    const savedProfile = await saveProfile(formData);

    setUser({
      role: savedProfile.role,
      name: savedProfile.name,
      bankName: savedProfile.bankName ?? undefined,
      accountNumber: savedProfile.accountNumber ?? undefined,
      cardholderName: savedProfile.cardholderName ?? undefined,
    });
    navigate("/", { replace: true });
  };

  return (
    <>
      <Title>Pilih Peran - Titip Makan</Title>
      <div class="tm-app-shell overflow-x-hidden">
        <div class="mx-auto flex min-h-screen w-full max-w-[30rem] flex-col px-6 pb-10 pt-0">
          <section class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-br from-primary-700 via-sky-600 to-cyan-500 px-6 pb-6 pt-7 text-white shadow-[0_18px_36px_rgba(15,104,140,0.2)]">
            <div class="absolute -right-4 -top-5 h-20 w-20 rounded-lg bg-white/10 rotate-12" />
            <div class="absolute right-8 top-12 h-14 w-14 rounded-lg bg-white/10" />
            <div class="absolute -bottom-5 left-8 size-8 rounded-lg bg-white/10 rotate-45" />

            <div class="relative z-10 mx-auto w-full max-w-[30rem]">
              <div class="flex items-start justify-between gap-4">
                <div class="flex size-8 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur">
                  <IconWallet class="h-8 w-8" />
                </div>
                <span class="inline-flex rounded-lg bg-white/15 px-3 py-1 text-sm font-semibold text-white">
                  Mulai Hari Ini
                </span>
              </div>

              <h1 class="mt-5  font-extrabold tracking-[-0.06em] text-white">
                Titip Makan
              </h1>
              <p class="mt-3 max-w-[15rem] text-base leading-7 text-white/90">
                Pilih cara kamu pakai aplikasi ini hari ini, lalu langsung
                mulai.
              </p>

              <div class="mt-5 grid grid-cols-2 gap-3">
                <div class="rounded-lg bg-white/10 px-4 py-3 backdrop-blur">
                  <p class="text-sm text-white/75">Peran Aktif</p>
                  <p class="mt-1 text-base font-semibold text-white">
                    {selectedRoleLabel()}
                  </p>
                </div>
                <div class="rounded-lg bg-white/10 px-4 py-3 backdrop-blur">
                  <p class="text-sm text-white/75">Fokus Hari Ini</p>
                  <p class="mt-1 text-base font-semibold text-white">
                    Makan siang lebih rapi
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div class="mt-5 flex flex-wrap gap-2">
            <For each={roleHighlights}>
              {(item) => (
                <span class="inline-flex rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
                  {item}
                </span>
              )}
            </For>
          </div>

          <form class="mt-6 flex flex-1 flex-col" onSubmit={handleSubmit}>
            <div class="tm-card p-5">
              <label class="mb-3 block text-base font-semibold text-slate-700">
                Nama Panggilan
              </label>
              <div class="relative">
                <IconUser class="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  class="input pl-14"
                  placeholder="Cth: Budi"
                  value={name()}
                  onInput={(e) => {
                    setName(e.currentTarget.value);
                    setError("");
                  }}
                />
              </div>
            </div>

            <div class="mt-6 flex items-end justify-between gap-4">
              <div>
                <p class="text-base font-semibold text-slate-800">
                  Pilih Peranmu Hari Ini
                </p>
                <p class="mt-2 text-sm text-slate-500">
                  Kamu bisa ganti role kapan saja dari aplikasi.
                </p>
              </div>
              <span class="rounded-lg bg-sky-100 px-3 py-2 text-sm font-semibold text-primary-700">
                2 Pilihan
              </span>
            </div>

            <div class="mt-4 space-y-4">
              <RoleOption
                title="Saya Nitip Makan"
                description="Pesan makanan bareng teman kantor"
                detail="Cocok kalau kamu ingin titip beli dan pantau status order sendiri."
                selected={selectedRole() === "pemesan"}
                onClick={() => {
                  setSelectedRole("pemesan");
                  setError("");
                }}
                icon={<IconUtensilsCrossed class="h-9 w-9" />}
                accentClass="bg-sky-100 text-primary-700"
                helperIcon={<IconStore class="h-4 w-4" />}
                helperText="Bisa lihat toko, menu, dan tagihanmu"
              />

              <RoleOption
                title="Saya Yang Belikan"
                description="Bantu belikan dan dapatkan insentif"
                detail="Cocok kalau kamu yang belanja, rekap pesanan, dan urus tagihan teman."
                selected={selectedRole() === "pembeli"}
                onClick={() => {
                  setSelectedRole("pembeli");
                  setError("");
                }}
                icon={<IconWallet class="h-9 w-9" />}
                accentClass="bg-emerald-100 text-emerald-700"
                helperIcon={<IconArrowRight class="h-4 w-4" />}
                helperText="Cocok untuk bantu beli dan rekap pembayaran"
              />
            </div>

            <Show when={selectedRole() === "pembeli"}>
              <div class="mt-4 tm-card p-5">
                <div class="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p class="text-base font-semibold text-slate-800">
                      Data Rekening
                    </p>
                    <p class="mt-1 text-sm text-slate-500">
                      Dipakai untuk identitas pembayaran saat bantu belikan.
                    </p>
                  </div>
                  <span class="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                    Wajib
                  </span>
                </div>

                <div class="space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-slate-700">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      class="input"
                      placeholder="Contoh: BCA"
                      value={bankName()}
                      onInput={(e) => {
                        setBankName(e.currentTarget.value);
                        setError("");
                      }}
                    />
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-semibold text-slate-700">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      inputmode="numeric"
                      class="input"
                      placeholder="Contoh: 1234567890"
                      value={accountNumber()}
                      onInput={(e) => {
                        setAccountNumber(
                          e.currentTarget.value.replace(/[^\d]/g, ""),
                        );
                        setError("");
                      }}
                    />
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-semibold text-slate-700">
                      Nama Cardholder
                    </label>
                    <input
                      type="text"
                      class="input"
                      placeholder="Contoh: Budi Santoso"
                      value={cardholderName()}
                      onInput={(e) => {
                        setCardholderName(e.currentTarget.value);
                        setError("");
                      }}
                    />
                  </div>
                </div>
              </div>
            </Show>

            <Show when={error()}>
              <p class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500">
                {error()}
              </p>
            </Show>

            <button type="submit" class="btn-primary w-full gap-3 mt-5">
              Mulai
              <IconArrowRight class="h-6 w-6" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function RoleOption(props: {
  title: string;
  description: string;
  detail: string;
  selected: boolean;
  onClick: () => void;
  icon: JSX.Element;
  accentClass: string;
  helperIcon: JSX.Element;
  helperText: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`tm-card flex w-full items-start gap-4 p-5 text-left transition-all ${
        props.selected
          ? "border-2 !border-primary-700 bg-sky-50/40 shadow-[0_16px_30px_rgba(12,115,147,0.12)]"
          : "border border-white hover:border-sky-100 hover:bg-white"
      }`}
    >
      <div
        class={`flex size-8 shrink-0 items-center justify-center rounded-lg ${props.accentClass}`}
      >
        {props.icon}
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class=" font-semibold leading-tight tracking-[-0.05em] text-slate-900">
              {props.title}
            </p>
            <p class="mt-2 text-base text-primary-700">{props.description}</p>
          </div>
          <Show
            when={props.selected}
            fallback={<IconCircle class="h-7 w-7 shrink-0 text-slate-300" />}
          >
            <IconCheckCircle class="h-7 w-7 shrink-0 text-primary-700" />
          </Show>
        </div>

        <p class="mt-3 text-sm leading-6 text-slate-600">{props.detail}</p>

        <div class="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
          {props.helperIcon}
          <span>{props.helperText}</span>
        </div>
      </div>
    </button>
  );
}
