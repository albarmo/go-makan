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
    <div class="tm-app-shell">
      <Header
        title={props.title}
        showBack={props.showBack}
        showUser={props.showUser}
      />
      <main class="tm-page">
        {props.children}
      </main>
      <Show when={user() && !props.noBottomNav}>
        <BottomNav />
      </Show>
    </div>
  );
};

export default Layout;
