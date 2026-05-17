import { Title } from "@solidjs/meta";
import { A, useAction, useNavigate } from "@solidjs/router";
import {
  ArrowRight as IconArrowRight,
  KeyRound as IconKeyRound,
  LockKeyhole as IconLockKeyhole,
  User as IconUser,
} from "lucide-solid";
import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { useUser } from "~/lib/user-context";
import {
  loginWithPinAction,
  registerWithPinAction,
} from "~/server/auth";

type AuthMode = "login" | "register";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan. Coba lagi ya.";
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, mounted, setUser } = useUser();
  const login = useAction(loginWithPinAction);
  const register = useAction(registerWithPinAction);
  const [mode, setMode] = createSignal<AuthMode>("login");
  const [username, setUsername] = createSignal("");
  const [pin, setPin] = createSignal("");
  const [error, setError] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);

  const title = createMemo(() =>
    mode() === "login" ? "Masuk ke Titip Makan" : "Buat Akun Baru",
  );

  createEffect(() => {
    if (!mounted()) return;
    const currentUser = user();
    if (!currentUser) return;
    navigate(currentUser.hasCompletedSetup ? "/" : "/role", { replace: true });
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const trimmedUsername = username().trim();
    const trimmedPin = pin().replace(/[^\d]/g, "");

    if (!trimmedUsername) {
      setError("Username wajib diisi.");
      return;
    }

    if (!/^\d{6}$/.test(trimmedPin)) {
      setError("PIN harus 6 digit.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("username", trimmedUsername);
      formData.set("pin", trimmedPin);

      const authenticatedUser =
        mode() === "login" ? await login(formData) : await register(formData);

      setUser(authenticatedUser);
      navigate(
        authenticatedUser.hasCompletedSetup ? "/" : "/role",
        { replace: true },
      );
    } catch (submitError) {
      setError(getErrorMessage(submitError));
      setSubmitting(false);
    }
  };

  return (
    <>
      <Title>Auth - Titip Makan</Title>
      <div class="tm-app-shell overflow-x-hidden">
        <div class="mx-auto flex min-h-screen w-full max-w-[30rem] flex-col px-6 pb-10 pt-0">
          <section class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-br from-primary-700 via-sky-600 to-cyan-500 px-6 pb-8 pt-8 text-white shadow-[0_18px_36px_rgba(15,104,140,0.18)]">
            <div class="absolute -right-6 top-5 h-24 w-24 rotate-12 rounded-lg bg-white/10" />
            <div class="absolute left-8 top-16 h-12 w-12 rounded-lg bg-white/10" />
            <div class="relative z-10 mx-auto w-full max-w-[30rem]">
              <div class="flex size-8 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur">
                <IconLockKeyhole class="h-8 w-8" />
              </div>

              <h1 class="mt-6 font-extrabold tracking-[-0.06em] text-white">
                {title()}
              </h1>
              <p class="mt-3 max-w-[17rem] text-base text-white/90">
                Pakai username dan PIN 6 digit supaya akunmu bisa dipakai dari
                device mana pun.
              </p>

              <div class="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  class={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    mode() === "login"
                      ? "bg-white text-primary-700"
                      : "bg-white/15 text-white"
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  class={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    mode() === "register"
                      ? "bg-white text-primary-700"
                      : "bg-white/15 text-white"
                  }`}
                >
                  Daftar
                </button>
              </div>
            </div>
          </section>

          <form class="mt-6 flex flex-1 flex-col" onSubmit={handleSubmit}>
            <div class="tm-card p-5">
              <div class="space-y-4">
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">
                    Username
                  </label>
                  <div class="relative">
                    <IconUser class="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      class="input pl-14"
                      placeholder="contoh: budi.ahlan"
                      value={username()}
                      onInput={(e) => {
                        setUsername(e.currentTarget.value);
                        setError("");
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">
                    PIN 6 Digit
                  </label>
                  <div class="relative">
                    <IconKeyRound class="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      inputmode="numeric"
                      maxlength="6"
                      class="input pl-14 tracking-[0.3em]"
                      placeholder="123456"
                      value={pin()}
                      onInput={(e) => {
                        setPin(e.currentTarget.value.replace(/[^\d]/g, "").slice(0, 6));
                        setError("");
                      }}
                    />
                  </div>
                </div>
              </div>

              <div class="mt-5 rounded-lg bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <p class="font-semibold text-slate-800">
                  {mode() === "login"
                    ? "Masuk untuk lanjut ke dashboard-mu."
                    : "Setelah daftar, kamu akan lanjut isi role dan profil pembayaran."}
                </p>
              </div>
            </div>

            <Show when={error()}>
              <p class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500">
                {error()}
              </p>
            </Show>

            <button
              type="submit"
              disabled={submitting()}
              class="btn-primary mt-5 w-full gap-3 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Show
                when={submitting()}
                fallback={mode() === "login" ? "Masuk" : "Buat Akun"}
              >
                Memproses...
              </Show>
              <IconArrowRight class="h-6 w-6" />
            </button>

            <p class="mt-5 text-center text-sm text-slate-500">
              Setelah masuk, kamu tetap bisa atur role dan data rekening dari{" "}
              <A href="/role" class="font-semibold text-primary-700">
                halaman account
              </A>
              .
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
