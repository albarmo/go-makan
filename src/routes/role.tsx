import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { useUser, Role } from "~/lib/user-context";

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
      setError("Pilih role terlebih dahulu");
      return;
    }
    if (!n) {
      setError("Nama tidak boleh kosong");
      return;
    }
    setUser({ role, name: n });
    navigate(role === "pemesan" ? "/" : "/buyer/orders", { replace: true });
  };

  return (
    <>
      <Title>Pilih Role - Titip Makan</Title>
      <div class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4 py-12">
        <div class="w-full max-w-sm">
          {/* Logo */}
          <div class="mb-8 text-center">
            <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-500 shadow-lg">
              <span class="text-4xl">🍱</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Titip Makan</h1>
            <p class="mt-1 text-sm text-gray-500">
              Nitip beli makan siang ke rekan kerja
            </p>
          </div>

          <form onSubmit={handleSubmit} class="space-y-5">
            {/* Role selection */}
            <div>
              <p class="mb-3 text-sm font-semibold text-gray-700">
                Saya adalah...
              </p>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("pemesan")}
                  class={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                    selectedRole() === "pemesan"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span class="text-3xl">🙋</span>
                  <div>
                    <p class="font-semibold">Yang Nitip</p>
                    <p class="text-xs opacity-70">Mau titip beli</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("pembeli")}
                  class={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                    selectedRole() === "pembeli"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span class="text-3xl">🛍️</span>
                  <div>
                    <p class="font-semibold">Yang Belikan</p>
                    <p class="text-xs opacity-70">Mau ke toko</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Name input */}
            <div>
              <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                Nama Kamu
              </label>
              <input
                type="text"
                class="input"
                placeholder="Contoh: Budi Santoso"
                value={name()}
                onInput={(e) => {
                  setName(e.currentTarget.value);
                  setError("");
                }}
                maxLength={100}
              />
            </div>

            <Show when={error()}>
              <p class="text-sm text-red-600">{error()}</p>
            </Show>

            <button type="submit" class="btn-primary w-full">
              Mulai
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
