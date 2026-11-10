export interface Avaliacao {
  id: number;
  emailAvaliador: string;
  emailAvaliado: string;
  comentarios: string;
  nota: number;
  dataAvaliacao: string;
}
export interface NovaAvaliacao {
  emailAvaliado: string;
  comentarios: string;
  nota: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public campos: Record<string, string> = {},
  ) {
    super(message);
  }
}

export async function request<T>(
  baseUrl: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/avaliacoes`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      "Não foi possível conectar à API. Confira sua conexão e tente novamente.",
      0,
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const fallback =
      response.status === 401
        ? "Sua sessão expirou. Entre novamente."
        : response.status === 403
          ? "Seu perfil não tem permissão para esta operação."
          : "Não foi possível concluir a operação. Tente novamente.";
    throw new ApiError(
      body.mensagem || fallback,
      response.status,
      body.campos ?? {},
    );
  }
  return response.json() as Promise<T>;
}

export function filterAvaliacoes(
  items: Avaliacao[],
  query: string,
  sort: string,
) {
  const term = query.trim().toLocaleLowerCase("pt-BR");
  return items
    .filter((item) =>
      [item.emailAvaliado, item.emailAvaliador, item.comentarios].some(
        (value) => value.toLocaleLowerCase("pt-BR").includes(term),
      ),
    )
    .sort((a, b) =>
      sort === "nota"
        ? b.nota - a.nota || b.id - a.id
        : Date.parse(b.dataAvaliacao) - Date.parse(a.dataAvaliacao) ||
          b.id - a.id,
    );
}
