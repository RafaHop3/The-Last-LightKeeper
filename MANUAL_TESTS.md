# Testes Manuais - Apliquei

## 🧪 Checklist de Testes para QA

Execute os testes em ordem. Marque ✅ ou ❒ ao lado de cada item.

---

## 🌐 Fluxo Público (Sem Login)

### Landing Page
- [ ] A página carrega sem erros
- [ ] Logo "Apliquei" redireciona para `/`
- [ ] Links "Para Candidatos" e "Para Recrutadores" funcionam
- [ ] Botões "Entrar" e "Cadastrar" no Navbar funcionam
- [ ] Link "Vagas" no Navbar vai para `/jobs`
- [ ] Seção de hero com título e subtítulo visíveis
- [ ] Cards de features (Candidatos, Recrutadores) com ícones e links

### Página de Vagas Públicas (`/jobs`)
- [ ] Lista de vagas carrega (mock ou reais)
- [ ] Busca por texto funciona
- [ ] Filtros por localização e tipo (Remoto, Presencial, Híbrido)
- [ ] Paginação se houver muitas vagas
- [ ] Clicar em uma vaga vai para `/jobs/:id`
- [ ] Cards mostram: título, empresa, local, tipo, salário (se houver), data

### Detalhe da Vaga (`/jobs/:id`)
- [ ] Todas as informações da vaga aparecem
- [ ] Botão "Candidatar-se" aparece para não-logados
- [ ] Clicar em "Candidatar-se" redireciona para `/login`
- [ ] Link "Voltar às vagas" funciona

### Preços (`/pricing`)
- [ ] Cards dos 4 planos (Grátis, Básico, Profissional, Enterprise)
- [ ] Ícones e cores diferenciados por tier
- [ ] Botão "Começar Grátis" leva para `/register`
- [ ] Botões pagos mostram "Fale com vendas" ou similar

### Login (`/login`)
- [ ] Formulário com email e senha
- [ ] Validação de email obrigatório
- [ ] Validação de senha obrigatória
- [ ] Link "Cadastre-se grátis" vai para `/register`
- [ ] Login com credenciais erradas mostra erro
- [ ] Login com sucesso redireciona conforme role:
  - Admin → `/admin`
  - Recrutador → `/recruiter`
  - Candidato → `/candidate`

### Cadastro (`/register`)
- [ ] Seleção de tipo de conta (Candidato/Recrutador)
- [ ] Campos obrigatórios: nome, email, senha
- [ ] Campo "Empresa" aparece só para Recrutador
- [ ] Validação de senha mínima (6 caracteres)
- [ ] Cadastro com sucesso redireciona conforme role
- [ ] Link "Já tem conta? Faça login" funciona

---

## 👤 Candidato (Logado)

### Dashboard (`/candidate`)
- [ ] Sidebar com: Início, Buscar Vagas, Minhas Candidaturas, Meu Perfil
- [ ] Cards de estatísticas: Total Candidaturas, Pendentes, Entrevistas, Aceitas
- [ ] Seção "Candidaturas Recentes" com últimas 5 aplicações
- [ ] Seção "Ações Rápidas" com links para Buscar Vagas, Todas Candidaturas, Editar Perfil
- [ ] Logo "Apliquei" no sidebar volta para `/candidate`

### Buscar Vagas (`/candidate/jobs`)
- [ ] Mesma UI da página pública mas dentro do painel
- [ ] Botão "Candidatar-se" aparece e abre formulário
- [ ] Formulário de candidatura com campo "Carta de Apresentação"
- [ ] Botão "Enviar Candidatura" funciona
- [ ] Após candidatura, vaga mostra "Já se candidatou"
- [ ] Links internos permanecem em `/candidate/jobs/:id`

### Detalhe da Vaga no Painel (`/candidate/jobs/:id`)
- [ ] Botão "Candidatar-se" com formulário inline
- [ ] Campo de texto para carta de apresentação
- [ ] Validação de campo obrigatório
- [ ] Sucesso ao candidatar: mensagem e botão desabilitado
- [ ] "Voltar às vagas" vai para `/candidate/jobs`

### Minhas Candidaturas (`/candidate/applications`)
- [ ] Lista de todas as candidaturas do usuário
- [ ] Filtros por status (Pendente, Em Análise, Entrevista, Aceito, Rejeitado)
- [ ] Busca por texto (título da vaga ou empresa)
- [ ] Cards mostram: vaga, empresa, status, data, carta (se houver)
- [ ] Ícone de "Ver vaga" leva para `/candidate/jobs/:id`
- [ ] Badge de status com cor correta

### Meu Perfil (`/candidate/profile`)
- [ ] Formulário com nome, email, bio, telefone, empresa, linkedin, github
- [ ] Upload de foto de perfil (avatar)
- [ ] Preview da foto antes de salvar
- [ ] Botão "Salvar Perfil" funciona
- [ ] Mensagem de sucesso ao atualizar
- [ ] Validação de email único

---

## 🏢 Recrutador (Logado)

### Dashboard (`/recruiter`)
- [ ] Cards: Vagas Ativas, Total Candidaturas, Novas Hoje
- [ ] Gráfico de candidaturas por mês (se houver)
- [ ] Lista de vagas recentes com botões "Ver Candidaturas", "Editar", "Desativar"
- [ ] Botão "Nova Vaga" leva para `/recruiter/create`

### Criar Vaga (`/recruiter/create`)
- [ ] Formulário completo: título, empresa, descrição, requisitos, tipo, local, salário
- [ ] Validação de campos obrigatórios
- [ ] Botão "Publicar Vaga" cria a vaga
- [ ] Redirecionamento para `/recruiter` após criação
- [ ] Vaga aparece na lista com status "Ativa"

### Editar Vaga (`/recruiter/edit/:id`)
- [ ] Formulário pré-preenchido com dados da vaga
- [ ] Edição de todos os campos
- [ ] Botão "Salvar Alterações" funciona
- [ ] Redirecionamento após salvar

### Candidaturas da Vaga (`/recruiter/jobs/:id/applications`)
- [ ] Lista de candidatos para aquela vaga
- [ ] Cards mostram: nome, email, carta de apresentação, status
- [ ] Dropdown para alterar status (Pendente → Em Análise → Entrevista → Aceito/Rejeitado)
- [ ] Filtros por status
- [ ] Busca por nome ou email
- [ ] Contador de candidatos por status

### Gerenciar Vagas
- [ ] Botão "Desativar" remove a vaga da listagem pública
- [ ] Vagas desativadas aparecem com estilo diferente
- [ ] Botão "Ativar" reativa a vaga
- [ ] Botão "Excluir" remove permanentemente (com confirmação)

---

## 🛡️ Administrador (Backoffice)

### Dashboard (`/admin`)
- [ ] Cards: Usuários Totais, Vagas, Candidaturas, Empresas
- [ ] Gráficos e métricas (se implementados)
- [ ] Links rápidos para outras seções

### Gestão de Usuários (`/admin/users`)
- [ ] Tabela com todos os usuários
- [ ] Colunas: nome, email, role, empresa, data cadastro
- [ ] Filtros por role (admin, recruiter, candidate)
- [ ] Busca por nome ou email
- [ ] Botão "Editar" abre modal com dados
- [ ] Dropdown para alterar role
- [ ] Botão "Desativar" (se implementado)

### Gestão de Planos (`/admin/plans`)
- [ ] Lista dos 4 tiers com preços e limites
- [ ] Edição de nome, preço, max jobs, max applications
- [ ] Ativar/desativar planos
- [ ] Visualização de empresas por plano

### Configurações (`/admin/settings`)
- [ **Tema:** Cores primária e secundária com preview
- [ **Logo:** Upload de logo com preview
- [ **SEO:** Meta title, description, keywords
- [ **Social:** URLs Facebook, LinkedIn, Twitter
- [ **Conteúdo:** Textos hero, footer
- [ ] Botão "Salvar" aplica mudanças em tempo real

### File Manager (`/admin/files`)
- [ ] Navegação por diretórios
- [ ] Upload de arquivos
- [ ] Preview de imagens
- [ ] Download de arquivos
- [ ] Excluir arquivos (com confirmação)

### Database Viewer (`/admin/database`)
- [ ] Lista de tabelas do banco
- [ ] Visualização de registros (paginada)
- [ ] Busca nas tabelas
- [ ] Exportar CSV (se implementado)

---

## 🔐 Testes de Segurança

### Autenticação
- [ ] Tentativa acessar rotas protegidas sem login → redireciona para `/login`
- [ ] Tentativa acessar admin com role diferente → 403 ou redireciona
- [ ] Token JWT expira → logout automático
- [ ] Logout limpa localStorage e redireciona

### CORS e API
- [ ] API responde apenas a origens permitidas
- [ ] Endpoints protegidos retornam 401 sem token
- [ ] Rate limiting (se implementado)

---

## 📱 Responsividade

### Mobile (< 768px)
- [ ] Navbar colapsa em menu hambúrguer
- [ ] Sidebar do candidato vira menu toggle
- [ ] Cards e formulários adaptam ao viewport
- [ ] Botões têm tamanho mínimo para toque

### Tablet (768px - 1024px)
- [ ] Layout intermediário funciona
- [ ] Grids reorganizam corretamente

---

## 🚀 Performance

### Carregamento
- [ ] Landing carrega em < 3s
- [ ] Dashboard do candidato carrega em < 2s
- [ ] Imagens têm lazy loading
- [ ] API responde em < 500ms

### Interação
- [ ] Transições suaves sem lag
- [ ] Formulários não travam ao submeter
- [ ] Paginação não recarrega página inteira

---

## 🐧 Edge Cases

### Dados
- [ ] Lista vazia mostra mensagem amigável
- [ ] Erro de API mostra toast genérico
- [ ] Upload de arquivo muito grande é rejeitado
- [ ] Formulário com campos inválidos não submete

### Rede
- [ ] Offline mostra mensagem (se implementado)
- [ ] Conexão lenta mostra loading states

---

## ✅ Critérios de Aceite

- [ ] Todos os fluxos principais funcionam sem erros
- [ ] UX é intuitiva e consistente
- [ ] Responsivo em mobile, tablet e desktop
- [ ] Performance adequada
- [ ] Segurança básica implementada
- [ ] Sem bugs críticos em produção

---

**Data:** ___________  
**Tester:** ___________  
**Versão:** ___________  
**Resultado:** ✅ APROVADO / ❒ REPROVADO  
**Observações:** _________________________________
