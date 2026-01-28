---
description: Initialize the development environment for gratex-admin-dashboard
---

# Initialize Development Environment

This workflow sets up your local development environment for the **gratex-admin-dashboard** React application.

## Project Overview

The admin dashboard is a modern React application using:
- **React 19.0.0** - Latest React version
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **TailwindCSS 4.0.8** - Utility-first CSS framework
- **React Router 7.1.5** - Client-side routing
- **TanStack Query 5.90.12** - Data fetching and state management
- **ApexCharts** - Data visualization
- **FullCalendar** - Calendar component

## Prerequisites

### ✅ Already Installed
- **PHP 8.5.1** - Verified (though not needed for this project)
- **Node.js & npm** - Required (needs verification)

## Setup Steps

### 1. Verify Node.js Installation
// turbo
```powershell
node --version
```

### 2. Verify npm Installation
// turbo
```powershell
npm --version
```

### 3. Install Dependencies

**Note**: The project already has a `node_modules` directory, but we should verify dependencies are up to date.

```powershell
npm install
```

### 4. Configure Environment Variables

The project has a `.env` file with:
```
VITE_API_URL=http://localhost:8000
```

This is already configured to connect to the **api-gratex** backend running on port 8000. ✅

### 5. Start Development Server
// turbo
```powershell
npm run dev
```

The Vite dev server typically runs on `http://localhost:5173` by default.

### 6. Test the Application

**Test in browser**: http://localhost:5173

**Verify**:
- Dashboard loads without errors
- Can connect to the API at `http://localhost:8000`
- All UI components render correctly
- TailwindCSS styles are applied

## Available Scripts

From `package.json`:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
gratex-admin-dashboard/
├── src/              # Source code
├── public/           # Static assets
├── index.html        # Entry HTML file
├── vite.config.ts    # Vite configuration
├── tsconfig.json     # TypeScript configuration
├── tailwind.config.js # TailwindCSS configuration (if exists)
├── .env              # Environment variables
└── package.json      # Dependencies and scripts
```

## Troubleshooting

**Issue**: "Node.js or npm not found"
- Install Node.js from: https://nodejs.org/
- Verify installation: `node --version` and `npm --version`

**Issue**: "Dependencies not installing"
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**Issue**: "Port 5173 is already in use"
- Stop other applications using port 5173
- Or Vite will automatically use the next available port

**Issue**: "Cannot connect to API"
- Verify the API is running at `http://localhost:8000`
- Check the `.env` file has the correct `VITE_API_URL`
- Check browser console for CORS errors

## Integration with Backend

The admin dashboard connects to the **api-gratex** backend:
1. Ensure the API is running: `php -S localhost:8000` (in api-gratex directory)
2. The dashboard uses the API URL from `.env`: `http://localhost:8000`
3. Authentication tokens are managed via API endpoints

## Next Steps

Once the server is running:
1. Test login functionality with API credentials
2. Verify all dashboard pages load correctly
3. Test CRUD operations (Create, Read, Update, Delete)
4. Verify data visualization components work
5. Check responsive design on different screen sizes
