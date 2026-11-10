import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, filterAvaliacoes, request, type Avaliacao } from "./api";

const items: Avaliacao[] = [
  {
    id: 1,
    emailAvaliador: "admin@empresa.com",
    emailAvaliado: "ana@empresa.com",
    comentarios: "Ótima comunicação",
    nota: 10,
    dataAvaliacao: "2026-11-09T10:00:00Z",
  },
  {
    id: 2,
    emailAvaliador: "outro@empresa.com",
    emailAvaliado: "bia@empresa.com",
    comentarios: "Bom trabalho",
    nota: 8,
    dataAvaliacao: "2026-11-10T10:00:00Z",
  },
];
afterEach(() => vi.unstubAllGlobals());
describe("avaliações", () => {
  it("ordena as recentes sem alterar os dados originais", () => {
    expect(
      filterAvaliacoes(items, "", "recentes").map((item) => item.id),
    ).toEqual([2, 1]);
    expect(items.map((item) => item.id)).toEqual([1, 2]);
  });
  it("busca por pessoa, avaliador e comentário ignorando maiúsculas", () => {
    expect(filterAvaliacoes(items, " ANA@ ", "recentes")).toHaveLength(1);
    expect(filterAvaliacoes(items, "ADMIN@", "recentes")).toHaveLength(1);
    expect(filterAvaliacoes(items, "COMUNICAÇÃO", "recentes")).toHaveLength(1);
    expect(filterAvaliacoes(items, "inexistente", "recentes")).toHaveLength(0);
  });
  it("ordena pela nota", () =>
    expect(filterAvaliacoes(items, "", "nota")[0].id).toBe(1));
  it("envia access token no header e corpo de cadastro", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(items[0]), { status: 201 }),
      );
    vi.stubGlobal("fetch", fetch);
    await request("https://api.example.com", "token", {
      method: "POST",
      body: '{"nota":10}',
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/avaliacoes",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
        body: '{"nota":10}',
      }),
    );
  });
  it("mantém as mensagens de validação por campo", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              mensagem: "Revise",
              campos: { nota: "De 0 a 10" },
            }),
            { status: 400 },
          ),
        ),
    );
    await expect(request("", "token")).rejects.toMatchObject({
      status: 400,
      campos: { nota: "De 0 a 10" },
    });
  });
  it("trata sessão expirada e resposta não JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("unauthorized", { status: 401 })),
    );
    await expect(request("", "token")).rejects.toMatchObject({
      status: 401,
      message: "Sua sessão expirou. Entre novamente.",
    });
  });
  it("trata falha de conexão", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(request("", "token")).rejects.toBeInstanceOf(ApiError);
  });
});
