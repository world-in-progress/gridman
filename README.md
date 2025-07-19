# Gridman

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Electron](https://img.shields.io/badge/Electron-36-blue?logo=electron)](https://www.electronjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-blue?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-blue?logo=tailwindcss)](https://tailwindcss.com/)

Gridman is a powerful desktop application for grid data editing and management, designed for professional fields such as geographic information systems (GIS), surveying, and geological modeling. The application is built around a core framework that provides comprehensive visualization, editing, and analysis capabilities. The main implementation resides in the `framework` directory, with an alternative frontend implementation available in the `frontend` directory.

---

## ✨ Core Features

### Main Framework Application
-   **Resource Scene Management**: 
    -   Advanced scene components for resource visualization and interaction
    -   Support for various resource types and formats
    -   Integrated with 3D rendering capabilities
-   **UI Component Library**: 
    -   Comprehensive set of reusable UI components based on shadcn/ui
    -   Consistent styling and behavior across the application
    -   Accessibility-focused design patterns
-   **Tab & Navigation Systems**: 
    -   Flexible tabBar for multi-document interface
    -   Customizable iconBar for tool and function access
    -   Context-aware navigation components
-   **Map Visualization**: 
    -   Advanced map container with multiple layer support
    -   Topology and feature visualization capabilities
    -   Integration with external mapping services
-   **Settings Architecture**: 
    -   Modular settings pages with consistent layout
    -   Dynamic configuration management
    -   User preference persistence
-   **Resource Scenario System**: 
    -   Schema and patch management for modeling scenarios
    -   Topology editing with visual feedback
    -   Data validation and consistency checks

### Alternative Frontend Implementation
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
│   ├── framework/         # Main application framework
│   │   ├── public/        # Static assets and shader files
│   │   │   ├── images/    # Image resources 
│   │   │   └── shaders/   # GLSL shader files
│   │   ├── src/
│   │   │   ├── components/# Core UI components
│   │   │   │   ├── resourceScene/
│   │   │   │   ├── tabBar/
│   │   │   │   ├── mapContainer/
│   │   │   │   ├── ui/    # Reusable UI components
│   │   │   │   └── ...
│   │   │   ├── core/      # Core functionality modules
│   │   │   │   ├── apis/  # API interfaces
│   │   │   │   ├── grid/  # Grid processing 
│   │   │   │   ├── message/# Messaging system
│   │   │   │   └── ...
│   │   │   ├── resource/  # Resource management
│   │   │   └── store.ts   # Framework state management
│   │   └── vite.config.ts # Framework Vite configuration
│   │
│   └── frontend/          # Alternative UI implementation
│       ├── public/        # Frontend static assets
│       ├── src/
│       │   ├── assets/    # Frontend-specific assets
│       │   ├── components/# Frontend UI Components
│       │   │   ├── aggregationPanel/
│       │   │   ├── gridPanel/
│       │   │   └── ...
│       │   ├── core/      # Core business logic (imports from framework)
│       │   └── store.ts   # Frontend state management
│       └── vite.config.ts # Frontend Vite configuration
│
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

    The project contains dependencies at three levels: root, main framework, and alternative frontend.

    ```bash
    # Install root dependencies (mainly for Electron)
    npm install

    # Install framework dependencies (main application)
    cd src/framework
    npm install

    # Optionally, install frontend dependencies (alternative implementation)
    cd ../frontend
    npm install
    ```

3.  **Run the Application in Development Mode**

    Return to the project root directory to run the start script.

    ```bash
    # Go back to the root directory
    cd ../..

    # Start the application in development mode (uses the framework implementation)
    npm start
    ```

4.  **Building for Production**

    ```bash
    # Build the framework (main application)
    cd src/framework
    npm run build
    
    # Return to root and package the application
    cd ../..
    npm run package
    ```

5.  **Development Workflow**

    - **Main Application Development**: Focus on the framework implementation
      ```bash
      cd src/framework
      npm run dev
      ```
    
    - **Alternative Frontend Development**: Work on the alternative implementation
      ```bash
      cd src/frontend
      npm run dev
      ```
    
    - **Full Application Development**: Run from the project root
      ```bash
      npm start
      ```

---

## 📝 TODO List

- [ ] **Core Documentation**: Create comprehensive API documentation for the framework components
- [ ] **Resource Scene Enhancement**: Add support for additional resource types and formats
- [ ] **Performance Optimization**: Improve rendering speed for complex topologies
- [ ] **User Interface Improvements**: Enhance tab system with dynamic loading/unloading
- [ ] **Data Persistence**: Implement user settings and preferences storage
- [ ] **Internationalization**: Complete i18n support for all UI components

---

## 🤝 Contributing

Contributions to Gridman are welcome! Please follow these steps:

1. **Fork the Repository**: Create your own fork of the project
2. **Create a Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Implement your changes with appropriate tests
4. **Commit Changes**: `git commit -m 'Add some amazing feature'`
5. **Push to Branch**: `git push origin feature/amazing-feature`
6. **Create Pull Request**: Submit a PR with a clear description of your changes

### Development Guidelines

- Follow the existing code style and patterns
- Write tests for new features
- Update documentation for API changes
- Add entries to the changelog for user-facing changes

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).