# Aulas de Teclado

Sistema pessoal para organizar aulas de teclado: agenda, alunos, materiais ensinados, valores, pagamentos, reposições e aviso no dia anterior.

É um sistema de usuário único, feito para um professor. Não há cadastro de alunos nem senha por aluno: existe uma senha de administrador e todo o acesso depende dela.

## Estado atual

Aplicação com oito telas implementadas e configuração de deploy. O lembrete automático por notificação push também está implementado. Ainda há problemas de autenticação e outras pendências descritas abaixo.

O que já funciona:

- Agenda semanal com criação, edição e exclusão de aulas.
- Cadastro de alunos com histórico, nível, valor e perfil.
- Registro de materiais ensinados, com filtro por aluno e ranking.
- Créditos de reposição, com agendamento da aula de reposição.
- Finanças do mês, com marcação de aula como paga.
- Notificação push para o aluno e lembrete automático no dia anterior, por cron.

O que não está resolvido:

- As rotas de API não validam a sessão. A proteção existe apenas nas páginas, então qualquer pessoa que descubra a URL da API consegue ler e alterar os dados. Isso está detalhado em [Limitações e pendências](#limitações-e-pendências).
- Não há testes automatizados.
- O modelo `Payment` e a rota `/api/payments` existem, mas nenhuma tela os usa.

## Funcionalidades implementadas

### Completas

**Agenda** — grade de 7 dias com navegação por semana, botão "Hoje" e destaque do dia atual. Cada aula registra aluno, data, hora, duração, tópico, material, valor, status, se é reposição, se foi paga e observações. A aula pode ser marcada como concluída.

**Alunos** — cadastro com nome, telefone, e-mail, nível, valor da aula, cor e observações, com busca por nome. O perfil do aluno mostra totais recebidos e a receber, histórico das últimas aulas, reposições pendentes, opção de ativar notificação push naquele dispositivo e um botão para enviar uma notificação de teste.

**Materiais** — tabela do que foi ensinado, com filtro por aluno, busca por texto e ranking dos dez materiais mais usados.

**Reposições** — registro de crédito com motivo, lista de pendentes e realizadas, e agendamento rápido da aula de reposição, que já aparece marcada na agenda.

**Finanças** — seleção de mês, três cartões com totais, tabela das aulas do mês com botão "Marcar pago" e resumo por aluno.

**Notificações push** — a interface registra um service worker, pede permissão e assina o dispositivo com a chave pública VAPID. O envio no servidor remove automaticamente inscrições que já não valem, quando o serviço responde 404 ou 410. Se as chaves VAPID não estiverem configuradas, o envio devolve erro em vez de derrubar o build.

**Lembrete do dia anterior** — uma rota de cron busca as aulas de amanhã com status de agendada ou reposição, de alunos ativos, e envia uma notificação por aluno. O cron está agendado para as 09:00 UTC.

**Autenticação** — uma senha comparada com bcrypt. A sessão é um JWT HS256 assinado com `SESSION_SECRET`, guardado em cookie httpOnly, válido por 30 dias.

**Interface** — barra lateral no desktop e dock inferior no celular, respeitando a área segura do aparelho. Todas as tabelas têm versão em cartões para telas pequenas.

### Parciais

- **O campo "Ativo/Inativo" do aluno aparece, mas não pode ser alterado pela interface.** O formulário de edição não envia o campo. Só a API aceita a mudança.
- **Os vínculos entre aula e reposição não são preenchidos.** O banco tem campos para ligar uma reposição à aula de origem e o crédito à aula que o consumiu, mas nenhuma tela os preenche, e a edição de aula não altera esse vínculo.
- **Marcar falta não gera crédito de reposição.** O professor precisa registrar a reposição à mão.

### Planejadas no banco, sem uso

- O modelo `Payment`, com valores, status e método de pagamento, e a rota `/api/payments`. As finanças reais são calculadas sobre o campo "paga" da aula, não sobre esse modelo. O status "atrasado" nunca é usado.

## Tecnologias

| Tecnologia | Versão |
|---|---|
| Next.js | 14.2.35 |
| React | ^18 |
| Prisma | ^7.9.1 |
| PostgreSQL | gerenciado pelo Neon ou outra nuvem |
| Tailwind CSS | ^3.4.1 |
| `web-push` | ^3.6.7 |
| `jose` | ^6.2.8, para o JWT |
| `bcryptjs` | ^3.0.3, para o hash da senha |
| TypeScript | ^5 |

- **App Router** do Next.js, com o servidor de páginas e as rotas de API no mesmo projeto.
- **Prisma 7** com o novo gerador `prisma-client` e o *driver adapter* `PrismaPg`, sem o motor de consulta em Rust. O client gerado fica em `lib/generated/prisma/` e está versionado no Git.
- **Cron da Vercel**, declarado no `vercel.json` (`"0 9 * * *"`). Não há biblioteca de agendamento no projeto.
- **Autenticação própria**, com bcrypt, `jose` e cookie. Não há NextAuth, Clerk nem outro provedor.
- **PWA** instalável, com manifest e service worker próprios.

## Modelo de dados

Cinco tabelas em `prisma/schema.prisma`:

| Modelo | O que guarda |
|---|---|
| `Student` | Aluno: nome, contato, nível, valor da aula, cor, ativo, observações |
| `Lesson` | Aula: aluno, data, duração, tópico, material, status, valor, se foi paga, se é reposição, vínculo com a aula de origem |
| `MakeUpCredit` | Crédito de reposição: aluno, motivo, se já foi usado, quando |
| `Payment` | Pagamento: aluno, aula, valor, status, data, método |
| `PushSubscription` | Dispositivo inscrito: aluno (ou nulo, para o professor), endpoint, chaves |

Três enumerações: nível do aluno (iniciante, intermediário, avançado), status da aula (agendada, concluída, cancelada, reposição, falta) e status do pagamento (pago, pendente, atrasado).

A migração inicial já está versionada em `prisma/migrations/`. **Não há script de seed.**

## Como executar

### Requisitos

- Node.js e npm
- Um PostgreSQL acessível. Pode ser local ou na nuvem; o Neon tem plano gratuito.

### Instalação

```bash
npm install
cp .env.example .env
```

Gere as chaves VAPID:

```bash
npx web-push generate-vapid-keys
```

Gere o hash da senha de acesso:

```bash
npm run hash:password -- SUA-SENHA
```

Crie as tabelas. Como a migração inicial já está no repositório, o caminho para um banco novo é:

```bash
npm run db:deploy
```

Rode:

```bash
npm run dev
```

Acesse `http://localhost:3000/login`.

Depois de alterar o schema, rode `npm run db:generate` para regerar o client em `lib/generated/`.

### Variáveis de ambiente

Todas as variáveis ficam em `.env`. O arquivo `.env.example` traz valores de exemplo.

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `VAPID_PUBLIC_KEY` | Chave pública VAPID |
| `VAPID_PRIVATE_KEY` | Chave privada VAPID |
| `VAPID_SUBJECT` | Contato no formato `mailto:` |
| `SESSION_SECRET` | Chave de assinatura do JWT da sessão |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt da senha, com os `$` escapados |
| `CRON_SECRET` | Token Bearer exigido pela rota de cron |
| `APP_URL` | Documentada, mas **não é lida por nenhum arquivo do projeto** |

Duas observações importantes:

- **A chave pública VAPID também está escrita no código**, em `lib/push-client-const.ts`, porque o navegador precisa dela. Se você gerar um par novo, atualize os dois lugares: o `.env` e esse arquivo.
- **`APP_URL` não é usada.** Está no `.env.example`, mas nenhuma linha do projeto a lê.

### Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run lint` | ESLint com as regras do Next.js |
| `npm run db:generate` | Gera o client do Prisma |
| `npm run db:migrate` | Cria uma migração nova |
| `npm run db:deploy` | Aplica as migrações |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run hash:password` | Gera o hash bcrypt da senha |

### Deploy

O projeto foi feito para a Vercel. O repositório se conecta a ela e as variáveis do `.env` são configuradas em *Settings → Environment Variables*. O cron já está declarado no `vercel.json`.

Para testar o lembrete à mão, chame a rota de cron com o token:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-DOMINIO/api/cron/reminders
```

## Como usar

1. Entre em `/login` com a senha de administrador.
2. Em **Início**, veja os cartões do dia e do mês, as aulas de hoje e as próximas.
3. Em **Agenda**, navegue por semana e crie uma aula informando o aluno, a data, a duração e o valor.
4. Em **Alunos**, cadastre o aluno. Clicar no nome abre o perfil, com histórico e reposições.
5. O aluno acessa o próprio perfil no celular, liga a notificação e confirma a permissão no navegador.
6. Em **Materiais**, registre o que foi ensinado. O filtro por aluno mostra o histórico dele.
7. Em **Reposições**, registre o crédito e agende a aula de reposição.
8. Em **Finanças**, escolha o mês e marque as aulas como pagas.
9. Em **Notificações**, veja os dispositivos inscritos e ligue o push no seu próprio aparelho.

O lembrete do dia anterior sai sozinho às 09:00 UTC, para as aulas cadastradas.

## Organização do projeto

| Pasta | Responsabilidade |
|---|---|
| `app/` | Páginas do App Router e as 14 rotas de API |
| `components/` | As telas e os modais, todos como Client Components |
| `lib/` | Autenticação, client do Prisma, envio de push e formatação |
| `lib/generated/prisma/` | Client do Prisma gerado, versionado no Git |
| `prisma/` | Schema, configuração e migrações |
| `scripts/` | Script que gera o hash da senha |
| `public/` | Service worker, manifest e ícone |

## Limitações e pendências

### Defeitos conhecidos

**Autenticação**

- **As rotas de API não validam a sessão.** Existe uma função `requireSession()` em `lib/auth.ts`, mas ela nunca é importada. As 13 rotas de dados fazem o CRUD direto, sem conferir o cookie. Na prática, proteger apenas as páginas deixa `GET /api/students` e `POST /api/lessons` acessíveis a quem souber o endereço. Não há `middleware.ts` protegendo as rotas.
- **`SESSION_SECRET` tem valor padrão `"dev-secret"`.** Se a variável não for definida no deploy, o cookie de sessão pode ser forjado.
- **Sem limite de tentativas** no login.
- **O script de hash tem senha padrão.** Executado sem argumento, `scripts/hash-password.mjs` usa `admin123`.

**Cron**

- **Se `CRON_SECRET` estiver vazio, a rota de cron fica aberta.** A checagem só rejeita a requisição quando a variável tem valor.

**Notificações**

- **A chave pública VAPID está fixa no código** e precisa ser atualizada à mão quando o par de chaves muda.
- **O botão de desativar push envia a requisição sem corpo**, e a rota exige o endpoint, então responde 400. A inscrição não é apagada do banco naquele momento. O navegador cancela a assinatura, mas o registro órfão só é removido depois, quando um envio falha com 404 ou 410.
- **A notificação de teste só chega no navegador em que o push está ativo.**

**Dados**

- **Apagar um aluno que tem aulas viola a chave estrangeira.** A migração usa `ON DELETE RESTRICT`, então o banco recusa a exclusão. A interface, porém, avisa que "todos os dados serão removidos".
- **`GET /api/lessons` sem os parâmetros `from` e `to` devolve todas as aulas, sem limite.** Materiais e Finanças usam exatamente essa chamada e filtram no navegador.
- **A listagem de aulas do perfil do aluno é limitada a 20**, e a de materiais a 100.
- **O filtro de mês em Finanças compara a data como texto** no formato ISO em UTC.

**Interface e build**

- **Agendar uma reposição usa `window.prompt()`**, com o formato fixo `AAAA-MM-DDTHH:MM`.
- **Todas as telas buscam dados por `fetch` no navegador.** O primeiro carregamento sempre mostra "Carregando..." e nada é cacheado no servidor.
- **Não há `error.tsx`, `loading.tsx` nem página de "não encontrado"** próprias.
- **Não há validação de entrada com biblioteca.** Os handlers usam `req.json()` e os campos direto, com checagem manual mínima.
- **`app/fonts/` tem dois arquivos Geist que nenhuma parte do projeto usa.** Resíduo do `create-next-app`.
- **A fonte Inter vem do Google por `next/font/google`**, então o build precisa de acesso à rede.

### Funcionalidades ainda não implementadas

- Tela para o modelo `Payment` e para o status "atrasado".
- Campo para marcar um aluno como inativo pela interface.
- Preenchimento automático do crédito de reposição quando uma aula é marcada como falta.
- Vínculo entre a reposição e a aula de origem.
- Qualquer suíte de testes.

## Próximos passos

O projeto não tem seção de próximos passos nem lista de pendências na documentação. O que está escrito hoje se resume a três apontamentos do README original:

- usar um PostgreSQL na nuvem, com o Neon como opção gratuita;
- o aluno ativar a notificação no próprio aparelho, pelo perfil dele;
- o botão "Enviar teste" do perfil do aluno como forma de conferir o push.

Os itens de segurança acima não estão registrados na documentação do projeto, mas são o que mais pesa no uso real do sistema.

## Testes

**Não há testes automatizados.** Não existe script de teste no `package.json`, nem pasta de testes, nem arquivo `*.test.*` ou `*.spec.*`, nem configuração de Vitest, Jest, Playwright ou Cypress. A seção de "testing" do `.gitignore` é resíduo de template.

A única verificação automatizada existente é o lint:

```bash
npm run lint
```

O `package-lock.json` cita o Playwright apenas como dependência opcional do próprio Next.js. Ele não está instalado.

## Licença

MIT. Ver `LICENSE`.
