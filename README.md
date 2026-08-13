# 🎹 Aulas de Teclado

Sistema pessoal para organizar aulas de teclado: agenda, alunos, materiais ensinados, valores, pagamentos, reposições e notificações push.

## Funcionalidades

- **Dashboard** — visão geral: aulas de hoje, próximas aulas, receita do mês, reposições pendentes
- **Agenda** — calendário semanal, criar/editar aulas, status (agendada, concluída, falta, cancelada, reposição)
- **Alunos** — cadastro com nível, valor da aula, cor de identificação; perfil com histórico, reposições e botão de notificações push
- **Materiais** — registro do que foi ensinado e qual material foi usado em cada aula, ranking de materiais mais usados
- **Reposições** — créditos de aula a repor com motivo, agendamento rápido da reposição
- **Finanças** — valor por aula, receita por mês, pendências por aluno, marcar pagamento
- **Notificações push** — Web Push + VAPID, lembretes automáticos 1 dia antes (cron diário 09:00)

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma 7 + PostgreSQL · web-push (VAPID) · Vercel Cron

## Setup local

```bash
npm install

# 1. Banco de dados PostgreSQL (local ou nuvem - Neon/Supabase/Vercel Postgres)
# 2. Configure o .env (veja .env.example)
cp .env.example .env   # Windows: copy .env.example .env

# 3. Gere as chaves VAPID
npx web-push generate-vapid-keys

# 4. Gere o hash da senha de acesso
node scripts/hash-password.mjs SUA-SENHA

# 5. Crie as tabelas no banco
npx prisma migrate dev --name init

# 6. Rode
npm run dev
```

Acesso: `http://localhost:3000/login` com a senha configurada.

## Deploy na Vercel

1. Suba o projeto para o GitHub e importe na Vercel
2. Configure um PostgreSQL na nuvem (Neon é grátis) e preencha as variáveis de ambiente do `.env` em **Settings → Environment Variables**
3. O cron de lembretes (`/api/cron/reminders`) está configurado no `vercel.json` — roda às 09:00 (UTC)
4. Para testar o cron manualmente: `GET /api/cron/reminders` com header `Authorization: Bearer <CRON_SECRET>`

## Notificações push

- O professor ativa no celular/computador pela página **Notificações**
- Cada aluno ativa no **perfil do aluno** (precisa abrir o site no dispositivo dele e permitir notificações)
- O cron diário envia o lembrete de aulas do dia seguinte para todos os dispositivos inscritos
- Endpoint de teste: página do aluno → "Enviar teste"

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Ambiente de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | Lint |
| `node scripts/hash-password.mjs SENHA` | Gera hash para `ADMIN_PASSWORD_HASH` |