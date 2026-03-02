# Apliquei - Plataforma de Vagas e Recrutamento

O **Apliquei** é uma plataforma completa e moderna de empregos, conectando empresas a talentos. O sistema possui três painéis distintos e integrados para Candidatos, Recrutadores e Administradores.

## 🚀 Tecnologias (Tech Stack)

O projeto é um monorepo que utiliza as seguintes tecnologias:

### **Backend**
- [FastAPI](https://fastapi.tiangolo.com/) - Framework web rápido e moderno em Python.
- [SQLAlchemy](https://www.sqlalchemy.org/) - ORM com suporte Assíncrono (`aiosqlite`).
- [Pydantic](https://docs.pydantic.dev/) - Validação de dados e serialização.
- Autenticação via **JWT** (JSON Web Tokens) com `passlib` e `bcrypt`.

### **Frontend**
- [React](https://react.dev/) + [Vite](https://vitejs.dev/) - Biblioteca UI e bundler.
- [Tailwind CSS](https://tailwindcss.com/) - Estilização utilitária e responsiva.
- [React Router DOM](https://reactrouter.com/) - Roteamento.
- [Lucide React](https://lucide.dev/) - Ícones SVG modernos.
- [Axios](https://axios-http.com/) - Cliente HTTP.

---

## 🎯 Funcionalidades por Perfil

### 🧑‍🎓 Candidatos
- **Painel Integrado:** Toda a experiência ocorre em um painel com barra lateral dedicada.
- **Busca de Vagas:** Filtros avançados por termo, localização e tipo.
- **Candidatura Simples:** Envio de carta de apresentação e anexos.
- **Minhas Candidaturas:** Acompanhamento do status em tempo real.
- **Perfil:** Edição de bio, links, telefone e upload de foto de perfil (Avatar).

### 🏢 Recrutadores
- **Dashboard de Gestão:** Visão geral das vagas abertas e candidaturas recentes.
- **Gestão de Vagas:** Criação, edição e encerramento de postos de trabalho.
- **Análise de Candidatos:** Leitura da carta de apresentação e alteração do status.

### 🛡️ Administrador (Backoffice)
- **Visão Geral:** Métricas do site.
- **Gestão de Usuários:** Edição de dados e papéis (roles) de qualquer usuário.
- **Configurações e SEO:** Alteração de cores do tema, textos hero, metatags de SEO.
- **Planos e Preços:** Gestão de tiers (Grátis, Básico, Pro, Enterprise).
- **File Manager e Database Viewer.**

---

## 🛠️ Como Rodar Localmente

### 1. Backend (API)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Acesse `http://localhost:5173`. O frontend faz proxy das rotas `/api` para `http://localhost:8000`.

---

## 🚢 Deploy (Produção via Railway)

O projeto está configurado para deploy em um único serviço no [Railway](https://railway.app) via `Dockerfile` multi-stage. O FastAPI serve a API em `/api/*` e o build estático do React (`frontend/dist`) na raiz `/`.

1. Crie um projeto no Railway e conecte este repositório do GitHub.
2. Configure a variável de ambiente: `SECRET_KEY` (obrigatória em produção).
3. O Railway fará o build do Node.js, depois do Python, e iniciará tudo na mesma porta via Uvicorn automaticamente.

