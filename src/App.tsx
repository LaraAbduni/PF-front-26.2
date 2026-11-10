import { useAuth0 } from "@auth0/auth0-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ApiError,
  filterAvaliacoes,
  request,
  type Avaliacao,
  type NovaAvaliacao,
} from "./api";
import { config } from "./config";

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      crescit<span className="brand-dot">.</span>
    </span>
  );
}
function Icon({
  name,
  size = 20,
}: {
  name:
    | "grid"
    | "plus"
    | "search"
    | "arrow"
    | "logout"
    | "star"
    | "people"
    | "check"
    | "close";
  size?: number;
}) {
  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    logout: (
      <>
        <path d="M9 4H4v16h5M10 12h11m-4-4 4 4-4 4" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m3 10v-3a6 6 0 0 0-2-4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const numberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

export function App() {
  const {
    isLoading,
    isAuthenticated,
    user,
    loginWithRedirect,
    logout,
    error,
    getAccessTokenSilently,
  } = useAuth0();
  const [actionError, setActionError] = useState("");
  const getToken = useCallback(async () => {
    const token = await getAccessTokenSilently();
    if (!token) throw new Error("Sessão expirada");
    return token;
  }, [getAccessTokenSilently]);
  function login() {
    setActionError("");
    void loginWithRedirect().catch(() =>
      setActionError("Não foi possível abrir o login. Tente novamente."),
    );
  }
  if (isLoading)
    return (
      <main className="setup">
        <Brand />
        <p role="status">Preparando seu espaço...</p>
      </main>
    );
  if (error || !isAuthenticated)
    return (
      <div className="login-page">
        <header className="login-header">
          <Brand />
          <span className="eyebrow">PESSOAS & DESENVOLVIMENTO</span>
        </header>
        <main className="login-content">
          <section className="login-copy">
            <span className="pill">
              O próximo passo começa com uma conversa.
            </span>
            <h1>
              Pessoas crescem.
              <br />
              Times <em>florescem.</em>
            </h1>
            <p>
              Um espaço para reconhecer o que vai bem e transformar feedback em
              novos caminhos.
            </p>
            <div className="login-caption">
              <span className="mini-stars" aria-hidden="true">
                ✦
              </span>{" "}
              Pequenas conversas. Grandes evoluções.
            </div>
          </section>
          <section className="login-card">
            <div className="login-symbol">
              <Icon name="people" size={28} />
            </div>
            <span className="eyebrow">SEU ESPAÇO DE AVALIAÇÕES</span>
            <h2>Bom ter você por aqui.</h2>
            <p>Entre com sua conta para acompanhar as avaliações do time.</p>
            {(error || actionError) && (
              <p role="alert" className="alert">
                {actionError ||
                  "Não foi possível concluir o login. Confira sua conta e tente novamente."}
              </p>
            )}
            <button className="button primary" onClick={login}>
              Entrar na minha conta <Icon name="arrow" />
            </button>
            <small>Acesso seguro com Auth0</small>
          </section>
        </main>
        <footer className="login-footer">
          Crescit · Sistema de avaliações
          <span>Feito para desenvolver pessoas.</span>
        </footer>
      </div>
    );
  const roles = user?.[`${config.namespace}/roles`];
  const isAdmin = Array.isArray(roles) && roles.includes("ADMIN");
  const hasAccess = isAdmin || (Array.isArray(roles) && roles.includes("USER"));
  return (
    <Dashboard
      userEmail={user?.email ?? ""}
      name={user?.given_name || user?.name || user?.email || "Pessoa"}
      isAdmin={isAdmin}
      hasAccess={hasAccess}
      getToken={getToken}
      login={login}
      onLogout={() => {
        void logout({
          logoutParams: { returnTo: window.location.origin },
        }).catch(() =>
          setActionError("Não foi possível sair. Tente novamente."),
        );
      }}
      actionError={actionError}
    />
  );
}

interface DashboardProps {
  userEmail: string;
  name: string;
  isAdmin: boolean;
  hasAccess: boolean;
  getToken: () => Promise<string>;
  login: () => void;
  onLogout: () => void;
  actionError: string;
}
function Dashboard({
  userEmail,
  name,
  isAdmin,
  hasAccess,
  getToken,
  login,
  onLogout,
  actionError,
}: DashboardProps) {
  const [items, setItems] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState("");
  const [expired, setExpired] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recentes");
  const [refresh, setRefresh] = useState(0);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const newButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setFailure("");
    setExpired(false);
    void getToken()
      .then((token) =>
        request<Avaliacao[]>(config.apiUrl, token, {
          signal: controller.signal,
        }),
      )
      .then((data) => {
        if (!controller.signal.aborted) setItems(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setFailure(
            error instanceof ApiError
              ? error.message
              : "Sua sessão precisa ser renovada. Entre novamente.",
          );
          setExpired(!(error instanceof ApiError) || error.status === 401);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [getToken, hasAccess, refresh]);
  const visible = filterAvaliacoes(items, query, sort);
  const average = items.length
    ? numberFormat.format(
        items.reduce((sum, item) => sum + item.nota, 0) / items.length,
      )
    : "—";
  function closeForm() {
    setCreating(false);
    requestAnimationFrame(() => newButton.current?.focus());
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <span className="workspace-label">ESPAÇO DO TIME</span>
        <a className="nav-active" href="#avaliacoes" aria-current="page">
          <Icon name="grid" /> Avaliações{" "}
          <span className="nav-count">
            {loading || failure ? "—" : items.length}
          </span>
        </a>
        <div className="sidebar-note">
          <span aria-hidden="true">↗</span>
          <p>
            Crescer é melhor
            <br />
            quando é <strong>junto.</strong>
          </p>
          <div className="note-lines" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="sidebar-bottom">
          <span className="connection-dot" /> Ambiente autenticado
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Meu espaço <span className="breadcrumb-slash">/</span>{" "}
            <strong>Avaliações</strong>
          </span>
          <div className="account">
            <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{name}</strong>
              <small>
                {isAdmin
                  ? "Administrador"
                  : hasAccess
                    ? "Colaborador"
                    : "Sem perfil atribuído"}
              </small>
            </div>
            <button
              className="icon-button"
              onClick={onLogout}
              aria-label="Sair da conta"
              title="Sair da conta"
            >
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <main id="avaliacoes" className="dashboard">
          <div className="page-heading">
            <div>
              <span className="eyebrow">FEEDBACK QUE TRANSFORMA</span>
              <h1>
                Um olhar para evoluir<span>.</span>
              </h1>
              <p>Acompanhe as avaliações e valorize cada passo do time.</p>
            </div>
            {isAdmin && (
              <button
                ref={newButton}
                className="button primary"
                onClick={() => {
                  setCreating(true);
                  setSuccess(false);
                }}
              >
                <Icon name="plus" /> Nova avaliação
              </button>
            )}
          </div>
          {actionError && (
            <p role="alert" className="alert">
              {actionError}
            </p>
          )}
          {success && (
            <div role="status" className="success">
              <Icon name="check" /> Avaliação cadastrada com sucesso.
              <button
                className="icon-button"
                aria-label="Fechar mensagem"
                onClick={() => setSuccess(false)}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {!hasAccess ? (
            <section className="empty-state">
              <Icon name="people" size={32} />
              <h2>Seu acesso está quase pronto.</h2>
              <p>
                Peça ao administrador para atribuir o perfil USER ou ADMIN à sua
                conta e entre novamente.
              </p>
              <button className="button primary" onClick={login}>
                Entrar novamente
              </button>
            </section>
          ) : (
            <>
              <section className="stats" aria-label="Resumo das avaliações">
                <Stat
                  label="Avaliações registradas"
                  value={
                    loading || failure
                      ? "—"
                      : String(items.length).padStart(2, "0")
                  }
                  detail="Conversas que viram crescimento"
                  icon="grid"
                />
                <Stat
                  label="Nota média do time"
                  value={loading || failure ? "—" : average}
                  detail="Em uma escala de 0 a 10"
                  icon="star"
                />
                <Stat
                  label="Pessoas avaliadas"
                  value={
                    loading || failure
                      ? "—"
                      : String(
                          new Set(
                            items.map((item) =>
                              item.emailAvaliado.toLowerCase(),
                            ),
                          ).size,
                        ).padStart(2, "0")
                  }
                  detail="Cada pessoa, uma nova perspectiva"
                  icon="people"
                />
              </section>
              <section
                className="reviews-panel"
                aria-labelledby="reviews-title"
              >
                <div className="panel-heading">
                  <div>
                    <h2 id="reviews-title">
                      Avaliações do time{" "}
                      <span>{loading || failure ? "—" : items.length}</span>
                    </h2>
                    <p>Reconhecimentos, aprendizados e próximos passos.</p>
                  </div>
                  <span className="view-badge">
                    <span className="connection-dot" />{" "}
                    {isAdmin ? "Acesso de administrador" : "Acesso de leitura"}
                  </span>
                </div>
                <div className="toolbar">
                  <label className="search">
                    <Icon name="search" />
                    <input
                      aria-label="Buscar avaliações"
                      placeholder="Buscar por pessoa ou comentário..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                  <label className="sort-label">
                    Ordenar por
                    <select
                      aria-label="Ordenar avaliações"
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                    >
                      <option value="recentes">Mais recentes</option>
                      <option value="nota">Maior nota</option>
                    </select>
                  </label>
                </div>
                {loading ? (
                  <div className="empty-state" role="status">
                    <span className="spinner" />
                    Carregando as avaliações...
                  </div>
                ) : failure ? (
                  <div className="empty-state">
                    <h3>Não foi possível carregar as avaliações.</h3>
                    <p role="alert">{failure}</p>
                    <button
                      className="button secondary"
                      onClick={() =>
                        expired ? login() : setRefresh((value) => value + 1)
                      }
                    >
                      {expired ? "Entrar novamente" : "Tentar novamente"}
                    </button>
                  </div>
                ) : !visible.length ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <Icon name={query ? "search" : "people"} size={28} />
                    </div>
                    <h3>
                      {query
                        ? "Nenhuma avaliação encontrada."
                        : "Toda evolução começa com um feedback."}
                    </h3>
                    <p>
                      {query
                        ? "Tente outro e-mail ou uma palavra diferente."
                        : isAdmin
                          ? "Cadastre a primeira avaliação e dê esse próximo passo com o time."
                          : "As avaliações aparecerão aqui assim que forem cadastradas por um administrador."}
                    </p>
                    {query && (
                      <button
                        className="button secondary"
                        onClick={() => setQuery("")}
                      >
                        Limpar busca
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Pessoa avaliada</th>
                          <th>Feedback</th>
                          <th>Nota</th>
                          <th>Data da avaliação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div className="person-cell">
                                <span className="avatar pale">
                                  {item.emailAvaliado.slice(0, 1).toUpperCase()}
                                </span>
                                <div>
                                  <strong>{item.emailAvaliado}</strong>
                                  <small>Por {item.emailAvaliador}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <p className="comment">{item.comentarios}</p>
                            </td>
                            <td>
                              <span
                                className={`score ${item.nota >= 7 ? "score-good" : item.nota >= 4 ? "score-mid" : "score-low"}`}
                              >
                                <Icon name="star" size={13} />
                                {numberFormat.format(item.nota)}
                                <small>/ 10</small>
                              </span>
                            </td>
                            <td className="date-cell">
                              {dateFormat.format(new Date(item.dataAvaliacao))}
                              <small>#{String(item.id).padStart(3, "0")}</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="panel-footer">
                  {!loading && !failure
                    ? `${visible.length} de ${items.length} avaliações`
                    : "Avaliações do time"}
                  <span>Um feedback hoje. Um novo caminho amanhã.</span>
                </div>
              </section>
            </>
          )}
          <footer className="dashboard-footer">
            <Brand />
            <span>Pessoas no centro. Crescimento em conjunto.</span>
          </footer>
        </main>
      </div>
      {creating && (
        <AvaliacaoForm
          email={userEmail}
          getToken={getToken}
          onClose={closeForm}
          onCreated={(item) => {
            setItems((previous) => [item, ...previous]);
            closeForm();
            setSuccess(true);
          }}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: "grid" | "star" | "people";
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon name={icon} />
        </span>
      </div>
      <strong className="stat-value">{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function AvaliacaoForm({
  email,
  getToken,
  onClose,
  onCreated,
}: {
  email: string;
  getToken: () => Promise<string>;
  onClose: () => void;
  onCreated: (item: Avaliacao) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [nota, setNota] = useState("8");
  const [comentarios, setComentarios] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    const payload: NovaAvaliacao = {
      emailAvaliado: String(data.get("emailAvaliado")).trim(),
      comentarios: comentarios.trim(),
      nota: Number(nota),
    };
    if (!payload.comentarios) {
      setCampos({ comentarios: "Escreva um comentário." });
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    setCampos({});
    try {
      const token = await getToken();
      const created = await request<Avaliacao>(config.apiUrl, token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated(created);
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Sua sessão precisa ser renovada. Saia e entre novamente.",
      );
      if (error instanceof ApiError) setCampos(error.campos);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      className="review-dialog"
      ref={dialog}
      aria-labelledby="form-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!submitting.current) onClose();
      }}
    >
      <form onSubmit={submit}>
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">UMA NOVA PERSPECTIVA</span>
            <h2 id="form-title">Nova avaliação</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label="Fechar formulário"
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="dialog-description">
          Compartilhe um feedback que ajude a pessoa a crescer.
        </p>
        <fieldset disabled={busy}>
          <label className="field">
            Quem está avaliando
            <input value={email} disabled />
            <small>Seu e-mail é registrado automaticamente.</small>
          </label>
          <label className="field">
            E-mail da pessoa avaliada
            <input
              name="emailAvaliado"
              type="email"
              placeholder="pessoa@empresa.com"
              autoFocus
              autoComplete="off"
              required
              maxLength={254}
              aria-invalid={!!campos.emailAvaliado}
              aria-describedby={
                campos.emailAvaliado ? "email-error" : undefined
              }
            />
            {campos.emailAvaliado && (
              <small className="field-error" id="email-error">
                {campos.emailAvaliado}
              </small>
            )}
          </label>
          <div className="grade-field">
            <label htmlFor="nota">Como você avalia essa experiência?</label>
            <div className="grade-control">
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                aria-label="Ajustar nota"
                value={nota}
                onChange={(event) => setNota(event.target.value)}
              />
              <div>
                <input
                  id="nota"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  required
                  value={nota}
                  onChange={(event) => setNota(event.target.value)}
                  aria-invalid={!!campos.nota}
                />
                <span>/ 10</span>
              </div>
            </div>
            <div className="range-labels">
              <span>Precisa desenvolver</span>
              <span>Excelente</span>
            </div>
            {campos.nota && (
              <small className="field-error">{campos.nota}</small>
            )}
          </div>
          <label className="field">
            Seu feedback
            <textarea
              name="comentarios"
              placeholder="O que foi bem? O que pode melhorar? Dê exemplos e sugestões de próximos passos."
              rows={4}
              required
              maxLength={2000}
              value={comentarios}
              onChange={(event) => setComentarios(event.target.value)}
              aria-invalid={!!campos.comentarios}
              aria-describedby={
                campos.comentarios ? "comment-error" : undefined
              }
            />
            <small className="character-count">
              {comentarios.length} / 2000
            </small>
            {campos.comentarios && (
              <small id="comment-error" className="field-error">
                {campos.comentarios}
              </small>
            )}
          </label>
        </fieldset>
        {error && (
          <p role="alert" className="alert">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <button
            className="button secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="button primary" type="submit" disabled={busy}>
            {busy ? "Salvando..." : "Publicar avaliação"}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </form>
    </dialog>
  );
}
