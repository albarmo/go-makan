import { useNavigate } from "@solidjs/router";
import { Bell as IconBell, ChevronLeft as IconChevronLeft } from "lucide-solid";
import { Show } from "solid-js";
import { useUser } from "~/lib/user-context";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showUser?: boolean;
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Header(props: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <header class="tm-topbar">
      <div class="mx-auto flex max-w-[30rem] items-center gap-3 px-6 py-4">
        <Show
          when={props.showBack}
          fallback={
            <>
              <Show
                when={props.showUser !== false && user()}
                fallback={
                  <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
                    TM
                  </div>
                }
              >
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-slate-200 text-sm font-bold text-primary-700 shadow-sm">
                  {initialsFromName(user()?.name ?? "TM")}
                </div>
              </Show>

              <div class="min-w-0 flex-1">
                <p class="truncate  font-extrabold tracking-[-0.06em] text-primary-700">
                  Titip Makan
                </p>
              </div>

              <button
                type="button"
                class="flex h-11 w-11 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-sky-50"
                aria-label="Notifikasi"
              >
                <IconBell class="h-6 w-6" />
              </button>
            </>
          }
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            class="flex h-11 w-11 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-sky-50"
            aria-label="Kembali"
          >
            <IconChevronLeft class="h-6 w-6" />
          </button>

          <div class="min-w-0 flex-1">
            <h1 class="truncate  font-extrabold tracking-[-0.05em] text-primary-700">
              {props.title}
            </h1>
          </div>
        </Show>
      </div>
    </header>
  );
}
