import { Title } from "@solidjs/meta";
import { useAction, useNavigate } from "@solidjs/router";
import {
  ArrowRight as IconArrowRight,
  Circle as IconCircle,
  CircleCheck as IconCheckCircle,
  LogOut as IconLogOut,
  ShieldCheck as IconShieldCheck,
  Store as IconStore,
  User as IconUser,
  UtensilsCrossed as IconUtensilsCrossed,
  Wallet as IconWallet,
} from "lucide-solid";
import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { Role, useUser } from "~/lib/user-context";
import { upsertUserProfileAction } from "~/server/profiles";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan. Coba lagi ya.";
}

export default function RolePage() {
  const navigate = useNavigate();
  const { user, mounted, setUser, clearUser } = useUser();
  const saveProfile = useAction(upsertUserProfileAction);
  const [selectedRole, setSelectedRole] = createSignal<Role>("pemesan");
  const [name, setName] = createSignal("");
  const [bankName, setBankName] = createSignal("");
  const [accountNumber, setAccountNumber] = createSignal("");
  const [cardholderName, setCardholderName] = createSignal("");
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  const currentUser = () => user();
  const selectedRoleLabel = createMemo(() =>
    selectedRole() === "pemesan" ? "Saya Nitip Makan" : "Saya Yang Belikan",
  );

  createEffect(() => {
    if (!mounted()) return;
    if (!currentUser()) {
      navigate("/auth", { replace: true });
      return;
    }

    setSelectedRole(currentUser()?.role ?? "pemesan");
    setName(currentUser()?.name ?? "");
    setBankName(currentUser()?.bankName ?? "");
    setAccountNumber(currentUser()?.accountNumber ?? "");
    setCardholderName(
      currentUser()?.cardholderName ?? currentUser()?.name ?? "",
    );
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const activeUser = currentUser();
    if (!activeUser) return;

    const trimmedName = name().trim();
    const trimmedBankName = bankName().trim();
    const trimmedAccountNumber = accountNumber().trim();
    const trimmedCardholderName = cardholderName().trim();

    if (!trimmedName) {
      setError("Nama panggilan tidak boleh kosong.");
      return;
    }

    if (
      selectedRole() === "pembeli" &&
      (!trimmedBankName || !trimmedAccountNumber || !trimmedCardholderName)
    ) {
      setError("Lengkapi data rekening untuk role yang belikan ya.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("userId", String(activeUser.id));
      formData.set("role", selectedRole());
      formData.set("name", trimmedName);
      formData.set(
        "bankName",
        selectedRole() === "pembeli" ? trimmedBankName : "",
      );
      formData.set(
        "accountNumber",
        selectedRole() === "pembeli" ? trimmedAccountNumber : "",
      );
      formData.set(
        "cardholderName",
        selectedRole() === "pembeli" ? trimmedCardholderName : "",
      );

      const savedProfile = await saveProfile(formData);
      setUser(savedProfile);
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearUser();
    navigate("/auth", { replace: true });
  };

  return (
    <>
      <Title>Akun & Peran - Titip Makan</Title>
      <Show
        when={mounted() && currentUser()}
        fallback={
          <div class="flex min-h-screen items-center justify-center">
            <div class="h-8 w-8 animate-spin rounded-lg border-4 border-primary-500 border-t-transparent" />
          </div>
        }
      >
        <div class="tm-app-shell overflow-x-hidden">
          <div class="mx-auto flex min-h-screen w-full max-w-[30rem] flex-col px-6 pb-10 pt-0">
            <section class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-br from-primary-700 via-sky-600 to-cyan-500 px-6 pb-6 pt-7 text-white shadow-[0_18px_36px_rgba(15,104,140,0.2)]">
              <div class="absolute -right-4 -top-5 h-20 w-20 rotate-12 rounded-lg bg-white/10" />
              <div class="absolute right-8 top-12 h-14 w-14 rounded-lg bg-white/10" />
              <div class="absolute -bottom-5 left-8 size-8 rotate-45 rounded-lg bg-white/10" />

              <div class="relative z-10 mx-auto w-full max-w-[30rem]">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex size-8 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur">
                    <IconShieldCheck class="h-8 w-8" />
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    class="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <IconLogOut class="h-4 w-4" />
                    Keluar
                  </button>
                </div>

                <h1 class="mt-5 font-extrabold tracking-[-0.06em] text-white">
                  {currentUser()?.hasCompletedSetup
                    ? "Atur Akun"
                    : "Lengkapi Profil"}
                </h1>
                <p class="mt-3 max-w-[16rem] text-base text-white/90">
                  Username dan PIN sudah aktif. Tinggal pilih role dan identitas
                  yang ingin dipakai hari ini.
                </p>

                <div class="mt-5 grid grid-cols-2 gap-3">
                  <div class="rounded-lg bg-white/10 px-4 py-3 backdrop-blur">
                    <p class="text-sm text-white/75">Username</p>
                    <p class="mt-1 text-base font-semibold text-white">
                      @{currentUser()?.username}
                    </p>
                  </div>
                  <div class="rounded-lg bg-white/10 px-4 py-3 backdrop-blur">
                    <p class="text-sm text-white/75">Role Aktif</p>
                    <p class="mt-1 text-base font-semibold text-white">
                      {selectedRoleLabel()}
                    </p>
                  </div>
                </div>

                <div class="mt-5 rounded-lg bg-white/12 p-4 backdrop-blur">
                  <label class="mb-3 block text-base font-semibold">
                    Nama Panggilan
                  </label>
                  <div class="relative">
                    <IconUser class="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-700" />
                    <input
                      type="text"
                      class="input border-white/20 bg-white/95 pl-14 shadow-none"
                      placeholder="Cth: Albar"
                      value={name()}
                      onInput={(e) => {
                        setName(e.currentTarget.value);
                        setError("");
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <form class="mt-5 flex flex-1 flex-col" onSubmit={handleSubmit}>
              <div class="flex items-end justify-between gap-4">
                <div>
                  <p class="text-base font-semibold text-slate-800">
                    Pilih Peranmu Hari Ini
                  </p>
                  <p class="text-sm text-slate-500">
                    Kamu bisa ganti role kapan saja dari aplikasi.
                  </p>
                </div>
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
                  description="Bantu belikan dan rekap pembayaran"
                  detail="Cocok kalau kamu yang belanja, pegang status pembelian, dan terima transfer."
                  selected={selectedRole() === "pembeli"}
                  onClick={() => {
                    setSelectedRole("pembeli");
                    setCardholderName((value) => value || name().trim());
                    setError("");
                  }}
                  icon={<IconWallet class="h-9 w-9" />}
                  accentClass="bg-emerald-100 text-emerald-700"
                  helperIcon={<IconArrowRight class="h-4 w-4" />}
                  helperText="Cocok untuk bantu beli dan urus tagihan"
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
                        Dipakai untuk flow pembayaran dari pemesan.
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

              <button
                type="submit"
                disabled={saving()}
                class="btn-primary mt-5 w-full gap-3 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Show when={saving()} fallback="Simpan & Lanjutkan">
                  Menyimpan...
                </Show>
                <IconArrowRight class="h-6 w-6" />
              </button>
            </form>
          </div>
        </div>
      </Show>
    </>
  );
}

function RoleOption(props: {
  title: string;
  description: string;
  detail: string;
  selected: boolean;
  onClick: () => void;
  icon: any;
  accentClass: string;
  helperIcon: any;
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
            <p class="font-semibold tracking-[-0.05em] text-slate-900">
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

        <p class="mt-3 text-sm text-slate-600">{props.detail}</p>

        <div class="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
          {props.helperIcon}
          <span>{props.helperText}</span>
        </div>
      </div>
    </button>
  );
}
