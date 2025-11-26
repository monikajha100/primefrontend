# Prime Academy Frontend

React + TypeScript + Vite frontend application with TailwindCSS and React Router.

## Features

- ⚛️ React 18 with TypeScript
- ⚡ Vite for fast development
- 🎨 TailwindCSS for styling
- 🛣️ React Router v6 for routing
- 🔐 JWT-based authentication with Axios interceptors
- 👥 Role-based routing (SuperAdmin, Admin, Faculty, Student)
- 🛡️ Protected routes

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API calls and Axios configuration
│   ├── components/       # Reusable React components
│   ├── context/         # React Context providers
│   ├── pages/           # Page components
│   ├── App.tsx          # Main App component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles with Tailwind
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

The application will start on `http://localhost:5173`

## Build

```bash
npm run build
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Features

### Authentication

- JWT token stored in localStorage
- Automatic token injection via Axios interceptors
- Token expiration handling
- Protected routes

### Role-Based Access

The application supports role-based routing:

- **SuperAdmin**: Full system access
- **Admin**: Batch and student management
- **Faculty**: Session and attendance management
- **Student**: Portfolio and batch viewing

### Protected Routes

Routes can be protected using the `ProtectedRoute` component:

```tsx
<ProtectedRoute allowedRoles={['admin', 'superadmin']}>
  <AdminPage />
</ProtectedRoute>
```

## API Integration

The frontend is configured to work with the Prime Academy backend API. Make sure the backend server is running on `http://localhost:3000` (or update the proxy in `vite.config.ts`).

## Technologies

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client with interceptors


