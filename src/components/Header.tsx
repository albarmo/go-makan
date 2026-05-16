import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";
import { useUser } from "~/lib/user-context";
import { IconChevronLeft } from "./icons";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showUser?: boolean;
}

export default function Header(props: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <header class="sticky top-0 z-40 bg-primary-700 text-white">
      <div class="mx-auto flex max-w-lg items-center gap-3 px-4 py-3.5">
        <Show when={props.showBack}>
          <button
            onClick={() => navigate(-1)}
            class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 active:bg-white/40"
            aria-label="Kembali"
          >
            <IconChevronLeft class="h-4 w-4" />
          </button>
        </Show>

        <div class="flex-1 min-w-0">
          <h1 class="truncate text-base font-bold tracking-tight">
            {props.title}
          </h1>
          <Show when={user() && props.showUser !== false}>
            <p class="truncate text-xs text-primary-200">
              {user()?.role === "pemesan" ? "Yang Nitip" : "Yang Belikan"}
              {" · "}
              <span class="font-semibold text-white">{user()?.name}</span>
            </p>
          </Show>
        </div>
      </div>
    </header>
  );
}
