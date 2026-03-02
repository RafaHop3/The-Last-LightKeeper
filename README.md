# Apliquei - Portal de Vagas de Emprego

Portal moderno de vagas de emprego com acesso para **recrutadores** e **candidatos**.

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite (async)
- **Frontend**: React + Vite + Tailwind CSS + Lucide Icons
- **Auth**: JWT (JSON Web Tokens)

## Como Rodar

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend roda em `http://localhost:5173` e faz proxy das chamadas `/api` para o backend em `http://localhost:8000`.

## Funcionalidades

### Candidatos
- Cadastro e login
- Busca de vagas com filtros (texto, localização, tipo)
- Visualização detalhada de vagas
- Candidatura com carta de apresentação
- Dashboard com acompanhamento de status

### Recrutadores
- Cadastro e login
- Criação, edição e exclusão de vagas
- Ativação/desativação de vagas
- Visualização de candidaturas recebidas
- Gestão de status (pendente, analisado, aceito, rejeitado)
