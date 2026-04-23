# FORGO TECH Painel

## Instalação
```bash
npm install
npm run dev
```

## Login real com Supabase
1. Crie um projeto no Supabase.
2. Em Authentication > Sign In / Providers, deixe Email habilitado.
3. Copie `.env.example` para `.env`.
4. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Rode novamente `npm run dev`.

Sem `.env`, o projeto entra em modo demonstração com login local.

## Publicação no Vercel
No Vercel, adicione as mesmas variáveis de ambiente do `.env` para ativar o login real em produção.
