import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { useUser, Role } from "~/lib/user-context";
import { IconCheckCircle, IconCircle, IconArrowRight } from "~/components/icons";

export default function RolePage() {
  const navigate = useNavigate();
  const { setUser, user } = useUser();
  const [selectedRole, setSelectedRole] = createSignal<Role | null>(
    user()?.role ?? null
  );
  const [name, setName] = createSignal(user()?.name ?? "");
  const [error, setError] = createSignal("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const role = selectedRole();
    const n = name().trim();
    if (!role) {
      setError("Pilih peranmu terlebih dahulu");
      return;
    }
    if (!n) {
      setError("Nama panggilan tidak boleh kosong");
      return;
    }
    setUser({ role, name: n });
    navigate(role === "pemesan" ? "/" : "/buyer/orders", { replace: true });
  };

  return (
    <>
      <Title>Mulai - Titip Makan</Title>
      <div class="flex min-h-screen flex-col bg-slate-100">
        {/* Top bar */}
        <div class="bg-primary-700 px-4 pb-8 pt-12">
          <div class="mx-auto max-w-lg">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <span class="text-xl">🍱</span>
              </div>
              <div>
                <h1 class="text-lg font-bold text-white">Titip Makan</h1>
                <p class="text-xs text-primary-200">Nitip beli makan siang</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content card that overlaps the top bar */}
        <div class="mx-auto w-full max-w-lg flex-1 -mt-4 px-4">
          <div class="rounded-2xl bg-white shadow-sm">
            <div class="p-5">
              <h2 class="text-base font-bold text-gray-900">Siapa kamu?</h2>
              <p class="mt-0.5 text-sm text-gray-500">Pilih peranmu untuk memulai</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Name input */}
              <div class="border-t border-gray-100 px-5 py-4">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Nama Panggilan
                </label>
                <input
                  type="text"
                  class="input"
                  placeholder="Contoh: Budi"
                  value={name()}
                  onInput={(e) => {
                    setName(e.currentTarget.value);
                    setError("");
                  }}
                  maxLength={100}
                />
              </div>

              {/* Role options */}
              <div class="border-t border-gray-100 px-5 py-4">
                <label class="mb-3 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Peran
                </label>
                <div class="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => { setSelectedRole("pemesan"); setError(""); }}
                    class={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      selectedRole() === "pemesan"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <span class="text-2xl">🙋</span>
                    <div class="flex-1">
                      <p class={`font-semibold ${selectedRole() === "pemesan" ? "text-primary-700" : "text-gray-800"}`}>
                        Saya Nitip Makan
                      </p>
                      <p class="text-xs text-gray-400">Mau titip beli makan siang</p>
                    </div>
                    <Show
                      when={selectedRole() === "pemesan"}
                      fallback={<IconCircle class="h-5 w-5 text-gray-300" />}
                    >
                      <IconCheckCircle class="h-5 w-5 text-primary-500" />
                    </Show>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSelectedRole("pembeli"); setError(""); }}
                    class={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      selectedRole() === "pembeli"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <span class="text-2xl">🛍️</span>
                    <div class="flex-1">
                      <p class={`font-semibold ${selectedRole() === "pembeli" ? "text-primary-700" : "text-gray-800"}`}>
                        Saya Yang Belikan
                      </p>
                      <p class="text-xs text-gray-400">Mau ke toko belikan teman</p>
                    </div>
                    <Show
                      when={selectedRole() === "pembeli"}
                      fallback={<IconCircle class="h-5 w-5 text-gray-300" />}
                    >
                      <IconCheckCircle class="h-5 w-5 text-primary-500" />
                    </Show>
                  </button>
                </div>
              </div>

              <Show when={error()}>
                <p class="px-5 pb-2 text-sm text-red-500">{error()}</p>
              </Show>

              <div class="border-t border-gray-100 p-5">
                <button
                  type="submit"
                  class="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Mulai
                  <IconArrowRight class="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
