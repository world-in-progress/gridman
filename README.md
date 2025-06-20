# Gridman

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Electron](https://img.shields.io/badge/Electron-36-blue?logo=electron)](https://www.electronjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-blue?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-blue?logo=tailwindcss)](https://tailwindcss.com/)

Gridman is a powerful desktop application for grid data editing and management, designed for professional fields such as geographic information systems (GIS), surveying, and geological modeling. It provides an interactive work environment that integrates visualization, editing, and analysis.

---

## ✨ Core Features

-   **Project Management**: Supports creating, loading, and managing multiple grid projects.
-   **Interactive Map**: Built with Mapbox GL for smooth map zooming, panning, and data visualization.
-   **Grid Editing**:
    -   Offers multiple selection modes including **Brush**, **Box Select**, and **Feature Select**.
    -   Supports topological operations on grids such as **Subdivide**, **Merge**, **Delete**, and **Recover**.
-   **Data Checking & Validation**: Includes built-in tools to ensure data quality.
-   **Feature Management**: Supports selecting and manipulating grids by importing external features (e.g., GeoJSON).
-   **Aggregation Workflow**: Provides a node-based interface for defining and executing data aggregation processes.
-   **3D Visualization**: Integrates `3d-tiles-renderer` to support 3D tile data visualization.

---

## 🛠️ Tech Stack

-   **Main Framework**: [Electron](https://www.electronjs.org/)
-   **Frontend Framework**: [React](https://react.dev/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI & Styling**:
    -   [Tailwind CSS](https://tailwindcss.com/): For rapidly building modern interfaces.
    -   [Shadcn/ui](https://ui.shadcn.com/) (Component Library): Provides high-quality, accessible UI components.
    -   [Lucide React](https://lucide.dev/): For clear and consistent icons.
-   **Mapping & Visualization**:
    -   [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/): High-performance interactive map library.
    -   [React Flow](https://reactflow.dev/): For building node-based editors.
-   **State Management**: Custom Context API and an event-driven `store`.

---

## 📂 Project Structure

```
gridman/
├── electron/              # Electron main process code
├── src/
│   └── frontend/
│       ├── public/        # Static assets (icons, shaders)
│       ├── src/
│       │   ├── assets/    # Image and media assets
│       │   ├── components/# React UI Components
│       │   │   ├── aggregationPanel/
│       │   │   ├── gridPanel/
│       │   │   ├── mapComponent/
│       │   │   └── ...
│       │   ├── core/      # Core business logic (grid, database, API)
│       │   ├── hooks/     # Custom React Hooks
│       │   └── store.ts   # Global state management
│       └── vite.config.ts # Vite configuration file
├── package.json           # Project dependencies and scripts
└── README.md              # That's me :)
```

---

## 🚀 Getting Started

1.  **Clone the repository**
    ```bash
    git clone <your-repository-url>
    cd gridman
    ```

2.  **Install Dependencies**

    The project contains a root `package.json` and a frontend `package.json`. You need to install dependencies in both locations.

    ```bash
    # Install root dependencies (mainly for Electron)
    npm install

    # Go to the frontend directory
    cd src/frontend

    # Install frontend dependencies
    npm install
    ```

3.  **Run the Application**

    Return to the project root directory to run the start script.

    ```bash
    # Go back to the root directory
    cd ../..

    # Start the application (this builds the Electron main process and starts the Vite dev server)
    npm start
    ```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).