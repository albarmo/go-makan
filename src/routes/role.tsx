import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import {
  IconArrowRight,
  IconCheckCircle,
  IconCircle,
  IconUser,
  IconUtensilsCrossed,
  IconWallet,
} from "~/components/icons";
import { Role, useUser } from "~/lib/user-context";

export default function RolePage() {
  const navigate = useNavigate();
  const { setUser, user } = useUser();
  const [selectedRole, setSelectedRole] = createSignal<Role | null>(
    user()?.role ?? null,
  );
  const [name, setName] = createSignal(user()?.name ?? "");
  const [error, setError] = createSignal("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const role = selectedRole();
    const trimmedName = name().trim();

    if (!trimmedName) {
      setError("Nama panggilan tidak boleh kosong.");
      return;
    }

    if (!role) {
      setError("Pilih peranmu dulu ya.");
      return;
    }

    setUser({ role, name: trimmedName });
    navigate("/", { replace: true });
  };

  return (
    <>
      <Title>Pilih Peran - Titip Makan</Title>
      <div class="tm-app-shell">
        <div class="mx-auto flex min-h-screen w-full max-w-[30rem] flex-col px-6 pb-10 pt-12">
          <div class="mb-10 flex flex-col items-center text-center">
            <div class="mb-8 flex h-44 w-44 items-center justify-center rounded-[2rem] bg-slate-200/70 text-primary-700 shadow-sm">
              <IconWallet class="h-20 w-20" />
            </div>
            <h1 class="text-xl font-extrabold tracking-[-0.07em] text-slate-900">
              Titip Makan
            </h1>
            <p class="mt-4 max-w-[18rem] text-lg leading-9 text-slate-600">
              Nitip beli makan siang jadi lebih gampang
            </p>
          </div>

          <form class="flex flex-1 flex-col" onSubmit={handleSubmit}>
            <label class="mb-3 text-lg font-semibold text-slate-700">
              Nama Panggilan
            </label>
            <div class="relative mb-12">
              <IconUser class="pointer-events-none absolute left-5 top-1/2 h-7 w-7 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                class="input pl-16 text-lg"
                placeholder="Cth: Budi"
                value={name()}
                onInput={(e) => {
                  setName(e.currentTarget.value);
                  setError("");
                }}
              />
            </div>

            <label class="mb-4 text-lg font-semibold text-slate-700">
              Pilih Peranmu Hari Ini
            </label>

            <div class="space-y-5">
              <RoleOption
                title="Saya Nitip Makan"
                description="Pesan makanan bareng teman kantor"
                selected={selectedRole() === "pemesan"}
                onClick={() => {
                  setSelectedRole("pemesan");
                  setError("");
                }}
                icon={<IconUtensilsCrossed class="h-10 w-10" />}
              />

              <RoleOption
                title="Saya Yang Belikan"
                description="Bantu belikan dan dapatkan insentif"
                selected={selectedRole() === "pembeli"}
                onClick={() => {
                  setSelectedRole("pembeli");
                  setError("");
                }}
                icon={<IconArrowRight class="h-10 w-10 rotate-[-45deg]" />}
              />
            </div>

            <Show when={error()}>
              <p class="mt-4 text-sm font-medium text-red-500">{error()}</p>
            </Show>

            <button
              type="submit"
              class="btn-primary mt-auto w-full gap-3 text-lg"
            >
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
  selected: boolean;
  onClick: () => void;
  icon: JSX.Element;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`tm-card flex w-full items-center gap-5 p-7 text-left transition-all ${
        props.selected ? "border-[3px] !border-primary-700" : ""
      }`}
    >
      <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sky-100 text-primary-700">
        {props.icon}
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-lg font-semibold leading-tight tracking-[-0.05em] text-slate-900">
          {props.title}
        </p>
        <p class="mt-2 text-base leading-8 text-slate-600">
          {props.description}
        </p>
      </div>

      <Show
        when={props.selected}
        fallback={<IconCircle class="h-10 w-10 shrink-0 text-slate-400" />}
      >
        <IconCheckCircle class="h-10 w-10 shrink-0 text-slate-500" />
      </Show>
    </button>
  );
}
