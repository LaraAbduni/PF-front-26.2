import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { App } from "./App";

const mocks = vi.hoisted(() => ({
  auth: {
    isLoading: false,
    isAuthenticated: true,
    user: {} as Record<string, unknown>,
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    error: undefined,
    getAccessTokenSilently: vi.fn().mockResolvedValue("access-token"),
  },
}));
vi.mock("@auth0/auth0-react", () => ({ useAuth0: () => mocks.auth }));
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  mocks.auth.isAuthenticated = true;
  mocks.auth.user = {
    email: "pessoa@empresa.com",
    "https://pf-avaliacoes.example.com/roles": ["USER"],
  };
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("[]", { status: 200 })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("USER lista sem ver botão de cadastro", async () => {
  render(<App />);
  await screen.findByText(
    "As avaliações aparecerão aqui assim que forem cadastradas por um administrador.",
  );
  expect(screen.queryByRole("button", { name: /Nova avaliação/i })).toBeNull();
  expect(fetch).toHaveBeenCalled();
});
it("ADMIN tem a ação de nova avaliação", async () => {
  mocks.auth.user["https://pf-avaliacoes.example.com/roles"] = ["ADMIN"];
  render(<App />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /Nova avaliação/i }),
    ).toBeTruthy(),
  );
});
it("sem role explica como obter acesso sem chamar a API", async () => {
  mocks.auth.user["https://pf-avaliacoes.example.com/roles"] = [];
  render(<App />);
  expect(await screen.findByText("Seu acesso está quase pronto.")).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
});
it("anônimo vê login sem chamar a API", () => {
  mocks.auth.isAuthenticated = false;
  render(<App />);
  expect(
    screen.getByRole("button", { name: /Entrar na minha conta/i }),
  ).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
});

it("ADMIN cadastra com access token e a nova avaliação aparece na lista", async () => {
  mocks.auth.user["https://pf-avaliacoes.example.com/roles"] = ["ADMIN"];
  const created = {
    id: 42,
    emailAvaliador: "pessoa@empresa.com",
    emailAvaliado: "colega@empresa.com",
    comentarios: "Boa colaboração.",
    nota: 9.5,
    dataAvaliacao: "2026-11-10T12:00:00Z",
  };
  const fetchMock = vi
    .fn()
    .mockImplementation(
      async (_url, options) =>
        new Response(
          JSON.stringify(options?.method === "POST" ? created : []),
          { status: options?.method === "POST" ? 201 : 200 },
        ),
    );
  vi.stubGlobal("fetch", fetchMock);
  render(<App />);
  await screen.findByText(
    "Cadastre a primeira avaliação e dê esse próximo passo com o time.",
  );
  fireEvent.click(screen.getByRole("button", { name: /Nova avaliação/i }));
  fireEvent.change(screen.getByPlaceholderText("pessoa@empresa.com"), {
    target: { value: "colega@empresa.com" },
  });
  fireEvent.change(
    screen.getByLabelText("Como você avalia essa experiência?"),
    { target: { value: "9.5" } },
  );
  fireEvent.change(screen.getByPlaceholderText(/O que foi bem/), {
    target: { value: "Boa colaboração." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));
  expect(
    await screen.findByText("Avaliação cadastrada com sucesso."),
  ).toBeTruthy();
  expect(screen.getByText("colega@empresa.com")).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  const post = fetchMock.mock.calls.find(
    ([, options]) => options.method === "POST",
  );
  expect(JSON.parse(post![1].body)).toEqual({
    emailAvaliado: "colega@empresa.com",
    comentarios: "Boa colaboração.",
    nota: 9.5,
  });
  expect(post![1].headers.Authorization).toBe("Bearer access-token");
});

it("erro de validação mantém o formulário aberto e mostra a mensagem do campo", async () => {
  mocks.auth.user["https://pf-avaliacoes.example.com/roles"] = ["ADMIN"];
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(async (_url, options) =>
        options?.method === "POST"
          ? new Response(
              JSON.stringify({
                mensagem: "Revise os campos.",
                campos: { nota: "A nota deve ser de 0 a 10." },
              }),
              { status: 400 },
            )
          : new Response("[]"),
      ),
  );
  render(<App />);
  await screen.findByText(
    "Cadastre a primeira avaliação e dê esse próximo passo com o time.",
  );
  fireEvent.click(screen.getByRole("button", { name: /Nova avaliação/i }));
  fireEvent.change(screen.getByPlaceholderText("pessoa@empresa.com"), {
    target: { value: "colega@empresa.com" },
  });
  fireEvent.change(screen.getByPlaceholderText(/O que foi bem/), {
    target: { value: "Comentário preservado." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));
  expect(await screen.findByText("A nota deve ser de 0 a 10.")).toBeTruthy();
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(
    (screen.getByPlaceholderText(/O que foi bem/) as HTMLTextAreaElement).value,
  ).toBe("Comentário preservado.");
});

it("sessão expirada oferece novo login e não apresenta dados inventados", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
  );
  render(<App />);
  expect(
    await screen.findByRole("button", { name: "Entrar novamente" }),
  ).toBeTruthy();
  expect(screen.queryByRole("table")).toBeNull();
});
