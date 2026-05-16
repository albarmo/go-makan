import { ParentComponent, Show, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser, Role } from "~/lib/user-context";

interface RoleGuardProps {
  requiredRole?: Role;
}

const RoleGuard: ParentComponent<RoleGuardProps> = (props) => {
  const navigate = useNavigate();
  const { user, mounted } = useUser();

  createEffect(() => {
    if (!mounted()) return;
    const u = user();
    if (!u) {
      navigate("/role", { replace: true });
      return;
    }
    if (props.requiredRole && u.role !== props.requiredRole) {
      navigate("/", { replace: true });
    }
  });

  return (
    <Show
      when={mounted() && user()}
      fallback={
        <div class="flex min-h-screen items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-lg border-4 border-primary-500 border-t-transparent" />
        </div>
      }
    >
      {props.children}
    </Show>
  );
};

export default RoleGuard;
