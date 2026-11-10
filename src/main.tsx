import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import { App, Brand } from "./App";
import { config, configurationError } from "./config";
import "./styles.css";

const error = configurationError();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {error ? (
      <main className="setup">
        <Brand />
        <h1>Vamos conectar seu espaço.</h1>
        <p role="alert">{error}</p>
      </main>
    ) : (
      <Auth0Provider
        domain={config.domain}
        clientId={config.clientId}
        cacheLocation="memory"
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: config.audience,
          scope: "openid profile email",
        }}
        onRedirectCallback={() =>
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          )
        }
      >
        <App />
      </Auth0Provider>
    )}
  </StrictMode>,
);
