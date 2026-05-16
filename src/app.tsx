import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { UserProvider } from "~/lib/user-context";
import "./global.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Titip Makan</Title>
          <UserProvider>
            <Suspense>{props.children}</Suspense>
          </UserProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
