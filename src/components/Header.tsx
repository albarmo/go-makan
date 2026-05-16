import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";
import { useUser } from "~/lib/user-context";
import { IconChevronLeft, IconLogout } from "./icons";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showUser?: boolean;
}

export default function Header(props: HeaderProps) {
  const navigate = useNavigate();
  const { user, clearUser } = useUser();

  const handleLogout = () => {
    if (confirm("Ganti role/nama?")) {
      clearUser();
      navigate("/role");
    }
  };

  return (
    <header class="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div class="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        <Show when={props.showBack}>
          <button
            onClick={() => navigate(-1)}
            class="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200"
            aria-label="Kembali"
          >
            <IconChevronLeft class="h-5 w-5" />
          </button>
        </Show>

        <div class="flex-1 min-w-0">
          <h1 class="truncate text-base font-semibold text-gray-900">
            {props.title}
          </h1>
          <Show when={user() && props.showUser !== false}>
            <p class="truncate text-xs text-gray-500">
              {user()?.role === "pemesan" ? "Yang Nitip" : "Yang Belikan"}
              {" · "}
              <span class="font-medium text-primary-600">{user()?.name}</span>
            </p>
          </Show>
        </div>

        <Show when={user() && props.showUser !== false}>
          <button
            onClick={handleLogout}
            class="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 active:bg-gray-200"
            aria-label="Ganti pengguna"
          >
            <IconLogout class="h-5 w-5" />
          </button>
        </Show>
      </div>
    </header>
  );
}
