# Crescit · Avaliações — Frontend da PF

React, TypeScript, Vite e Auth0. Login pelo Universal Login; chamadas à API com access token; listagem, busca por pessoa/comentário, ordenação por data ou nota, resumo do time e cadastro exclusivo para ADMIN. USER tem acesso à listagem. A API também aplica as permissões: esconder o botão não é a proteção de segurança.

## Executar localmente

Requisito: Node.js 22.12 ou superior.

```powershell
Copy-Item .env.example .env
# Edite .env com os dados do SEU Auth0.
npm ci
npm run dev
```

Abra `http://localhost:5173`. Suba o backend em `http://localhost:8084`.

| Variável | Valor |
| --- | --- |
| `VITE_AUTH0_DOMAIN` | Seu domínio Auth0, sem `https://` e sem `/` final |
| `VITE_AUTH0_CLIENT_ID` | Client ID da sua aplicação Single Page Application |
| `VITE_AUTH0_AUDIENCE` | `https://api.pf-avaliacoes` |
| `VITE_AUTH0_CLAIM_NAMESPACE` | `https://pf-avaliacoes.example.com` |
| `VITE_API_URL` | `http://localhost:8084` local; URL HTTPS da API em produção |

As variáveis `VITE_` são públicas e entram no bundle durante o build. Não coloque Client Secret, chave SSH ou senha do banco no front. O SDK mantém os tokens em memória.

## Validar

```powershell
npm test
npm run build
```

O build executa a checagem TypeScript e produz `dist/`. Os testes verificam envio do access token, tratamento de erros, busca, ordenação e exibição das ações para ADMIN e USER.

## Publicar na sua Vercel

1. Entre com sua própria conta Vercel e importe `LaraAbduni/PF-front-26.2`.
2. Framework: **Vite**. Root Directory: **./**. Build: `npm run build`. Output: `dist`. Node: **22.x**.
3. Cadastre as cinco variáveis acima em Settings → Environment Variables. Em produção, use `VITE_API_URL=https://avaliacoes.100-53-222-83.sslip.io:8081` depois de configurar o proxy da AWS.
4. Faça Deploy. Copie a URL de produção que a Vercel realmente atribuir ao seu projeto.
5. Adicione essa URL nos três campos do seu Auth0: Allowed Callback URLs, Allowed Logout URLs e Allowed Web Origins. Preserve também `http://localhost:5173` se for testar localmente.
6. No repositório do back, ajuste `FRONTEND_URL` para essa URL, sem `/` final, e execute novamente o workflow.
7. Ao mudar uma variável `VITE_`, faça um novo deploy na Vercel.

O `vercel.json` já define o build e o retorno da SPA. O cadastro usa a mesma origem para retorno do login e logout.

Veja o passo a passo completo com Auth0, Action, AWS e testes em [GUIA-DEPLOY.md do backend](https://github.com/LaraAbduni/PF-26.2/blob/main/docs/GUIA-DEPLOY.md).
