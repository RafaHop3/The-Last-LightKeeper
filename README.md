# Apliquei - Portal de Vagas

Plataforma de recrutamento com painel para candidatos, recrutadores e admin.

## Stack
- **Backend:** FastAPI + SQLAlchemy (async) + SQLite
- **Frontend:** React + Vite + TailwindCSS
- **Auth:** JWT (JSON Web Tokens)

## Desenvolvimento Local

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

O frontend roda em `http://localhost:5173` e faz proxy para o backend em `http://localhost:8000`.

## Deploy no Railway

O projeto roda como **monorepo** — um único service que:
1. Builda o frontend React (`npm run build`)
2. Instala dependências Python
3. Roda o FastAPI servindo API + frontend estático

### Variáveis de ambiente no Railway:
| Variável | Descrição | Default |
|---|---|---|
| `SECRET_KEY` | Chave JWT (obrigatória em prod) | `apliquei-super-secret-...` |
| `DATABASE_URL` | URL do banco | `sqlite+aiosqlite:///./apliquei.db` |
| `PORT` | Porta (Railway define automaticamente) | `8000` |

### Setup:
1. Crie um novo projeto no Railway
2. Conecte o repo GitHub `solariscodes/apliquei`
3. Defina `SECRET_KEY` nas variáveis de ambiente
4. Deploy automático via push na `main`

## Funcionalidades

### Candidatos
- Painel completo com sidebar (Início, Vagas, Candidaturas, Perfil)
- Busca de vagas com filtros (texto, localização, tipo)
- Candidatura com carta de apresentação
- Acompanhamento de status das candidaturas
- Edição de perfil com upload de foto

### Recrutadores
- Dashboard com gestão de vagas
- Criação, edição e exclusão de vagas
- Visualização de candidaturas recebidas
- Gestão de status (pendente, analisado, aceito, rejeitado)

### Admin (Backoffice)
- Gestão de usuários, planos, configurações
- Gerenciador de arquivos
- Visualizador de banco de dados
