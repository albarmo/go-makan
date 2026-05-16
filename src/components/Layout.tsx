import { ParentComponent, Show } from "solid-js";
import { useUser } from "~/lib/user-context";
import Header from "./Header";
import BottomNav from "./BottomNav";

interface LayoutProps {
  title: string;
  showBack?: boolean;
  showUser?: boolean;
  noBottomNav?: boolean;
}

const Layout: ParentComponent<LayoutProps> = (props) => {
  const { user } = useUser();

  return (
    <div class="min-h-screen bg-gray-50">
      <Header
        title={props.title}
        showBack={props.showBack}
        showUser={props.showUser}
      />
      <main class="mx-auto max-w-lg px-4 py-4 pb-24">
        {props.children}
      </main>
      <Show when={user() && !props.noBottomNav}>
        <BottomNav />
      </Show>
    </div>
  );
};

export default Layout;
