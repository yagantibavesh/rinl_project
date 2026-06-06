# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Running the full app locally

This repository contains both frontend and backend code.

1. Backend setup

- Copy `backend/.env.example` to `backend/.env` if you need to override values.
- Make sure MongoDB is available locally or update `MONGO_URI` in `backend/.env`.
- Start the backend server:

```bash
cd backend
npm install
npm run dev
```

2. Frontend setup

- The frontend reads `VITE_API_URL` from `frontend/.env.local`.
- `frontend/.env.local` is already created with:

```bash
VITE_API_URL=http://localhost:5000/api
```

- Start the frontend server:

```bash
cd frontend
npm install
npm run dev
```

3. Optional seed data

To populate demo users and requests, run:

```bash
cd backend
npm run seed
```

4. Open the app

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5000/api/health`

5. Demo login credentials

- Admin: `RINL-ADMIN-001` / `Test@1234`
- Manager: `RINL-MGR-BF-01` / `Test@1234`
- Employee: `RINL-EMP-001` / `Test@1234`
