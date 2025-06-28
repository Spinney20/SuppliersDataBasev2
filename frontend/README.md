# Suppliers Database Application

A desktop application for managing supplier data, built with React, Vite, and Electron.

## Features

- Modern React UI with Material UI components
- PostgreSQL database support (local, Neon cloud, or custom server)
- Desktop application with Electron
- Multiple database connection options

## Development

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- PostgreSQL

### Installation

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Set up Python environment:

```bash
cd backend
pip install -r requirements.txt  # If requirements.txt exists
# or
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic pydantic-settings
```

### Running the Application

#### Web Development Mode

```bash
cd frontend
npm run dev
```

#### Electron Development Mode

```bash
cd frontend
npm.cmd run electron:dev
```

This will start both the Vite development server and the Electron application.

### Building for Production

To build the Electron application:

```bash
cd frontend
npm.cmd run electron:build
```

This will create an installer in the `dist_electron` directory.

## Database Configuration

The application supports three types of database connections:

1. **Local PostgreSQL** - For development and local usage
2. **Neon Cloud** - For cloud-based PostgreSQL
3. **Custom Server** - For connecting to your own PostgreSQL server

You can configure the database connection in the application settings (accessible from the home screen when running in Electron).

## Project Structure

- `frontend/` - React frontend code
  - `src/` - React components and application code
  - `electron/` - Electron-specific code
- `backend/` - Python FastAPI backend

## Technologies Used

- React
- Vite
- Electron
- Material UI
- FastAPI
- SQLAlchemy
- PostgreSQL
