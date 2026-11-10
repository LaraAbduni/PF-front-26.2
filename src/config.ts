export const config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN?.trim() ?? "",
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID?.trim() ?? "",
  audience: import.meta.env.VITE_AUTH0_AUDIENCE?.trim() ?? "",
  namespace:
    import.meta.env.VITE_AUTH0_CLAIM_NAMESPACE?.trim() ||
    "https://pf-avaliacoes.example.com",
  apiUrl: (import.meta.env.VITE_API_URL?.trim() ?? "").replace(/\/$/, ""),
};

export function configurationError(): string | undefined {
  if (
    !config.domain ||
    !config.clientId ||
    !config.audience ||
    !config.apiUrl ||
    config.domain.includes("SEU-") ||
    config.clientId.includes("SEU_")
  ) {
    return "Configure o seu Auth0 e o endereço da API para abrir o sistema. Siga o README do projeto.";
  }
  if (!/^https?:\/\//.test(config.apiUrl))
    return "O endereço da API precisa começar com http:// ou https://.";
  if (
    window.location.protocol === "https:" &&
    !config.apiUrl.startsWith("https://")
  ) {
    return "O site está em HTTPS. Configure também um endereço HTTPS para a API.";
  }
}
