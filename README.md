# 🏋️‍♂️ Strive

**Strive** é uma plataforma web de acompanhamento de treinos que conecta **personal trainers** e **clientes**, permitindo a criação, gestão e monitorização de **planos de treino personalizados**, tudo num ambiente moderno, intuitivo e responsivo.

---

## 🚀 Tecnologias Utilizadas

### 🧩 **Frontend**
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (ambiente de desenvolvimento)
- [TailwindCSS](https://tailwindcss.com/) (estilização moderna)
- [React Router](https://reactrouter.com/) (gestão de navegação)
- Context API (`useContext`) (gestão de **tema** e **autenticação**)
- [Recharts](https://recharts.org/) (para gráficos nos dashboards)

### ⚙️ **Backend**
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Mongoose](https://mongoosejs.com/) (modelação dos dados em MongoDB)
- [JWT](https://jwt.io/) (autenticação e autorização)
- [Multer](https://www.npmjs.com/package/multer) (para upload de imagens e documentos)
- [Swagger](https://swagger.io/) (documentação da API)
- [Socket.io](https://socket.io/) (chat em tempo real e notificações)

### 🗃️ **Base de Dados**
- [MongoDB](https://www.mongodb.com/) (armazenamento flexível e escalável)

---

## 🧠 Descrição do Projeto

A **Strive** foi concebida para apoiar personal trainers e os seus clientes na gestão e acompanhamento dos treinos.  
Com esta plataforma, os treinadores podem criar planos de treino personalizados, acompanhar o progresso dos clientes e comunicar de forma direta, enquanto os clientes podem registar o cumprimento dos treinos e visualizar o seu progresso ao longo do tempo.


---

## 🧩 Estrutura do Projeto

```bash
/strive
├── backend/              
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   └── utils/
│   ├── tests/
│   └── swagger/
│
├── frontend/             
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── assets/
│
└── README.md


