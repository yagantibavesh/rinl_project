# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Connecting to the backend API

To connect the frontend to the backend during development, set the API base URL in a local environment file and start both servers:

- Create a file at [frontend/.env.local](frontend/.env.local) with the following content:

```
VITE_API_URL=http://localhost:5000/api
```

- The frontend uses [frontend/src/utils/api.js](frontend/src/utils/api.js) which reads `VITE_API_URL` and attaches the JWT from `localStorage` to every request.

- Start the backend:

```bash
cd backend
npm install
npm run dev
```

- Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

When both are running, the frontend (Vite) served at `http://localhost:5173` will make API requests to the backend at `http://localhost:5000/api`.
