# MeuPDV

Frontend do sistema PDV (Ponto de Venda) — tema azul + branco, identidade MeuPDV.

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** (design tokens: primary azul, bordas 12px, botões 44px)
- **React Router** (rotas: `/login`, `/register`, `/forgot`)
- **lucide-react** (ícones)

## Como rodar

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173). Rotas:

- `/login` — Tela de login
- `/register` — Cadastro etapa 1 (Crie sua conta)
- `/forgot` — Esqueci a senha (placeholder)

## Estrutura

- `print/` — Prints de referência (login.png, cadastroLogin1.png)
- `src/components/` — AuthSplitLayout, TextField, PrimaryButton, SecondaryButton, Stepper, LogoMeuPDV
- `src/pages/` — Login, RegisterStep1, ForgotPassword
- Design system em `tailwind.config.js` e `src/index.css` (tokens)

## Comportamentos

- Validação simples: nome e e-mail obrigatórios no cadastro; e-mail e senha no login.
- Botões com loading (spinner + disabled).
- Toggle mostrar/ocultar senha no login.
- Links: "Entre aqui" → `/login`, "Criar nova conta" → `/register`, "Esqueci a senha" → `/forgot`.
- Sem backend: handlers mock com `console.log`.

## Build

```bash
npm run build
npm run preview
```
