# Project Structure

This document describes the structure of the project, its main files and directories.

## Top Level

- **`.editorconfig`**: Configuration for code editors.
- **`.gitattributes`**: Defines attributes for pathnames.
- **`.gitignore`**: Specifies intentionally untracked files to ignore.
- **`.prettierrc.json`**: Configuration for Prettier code formatter.
- **`.vscode/`**: Contains Visual Studio Code specific settings.
- **`README.md`**: The main readme file for the project.
- **`TECH_SPEC.md`**: Technical specifications for the project.
- **`env.d.ts`**: TypeScript declarations for environment variables.
- **`eslint.config.ts`**: Configuration for ESLint.
- **`index.html`**: The main HTML file of the application.
- **`package-lock.json`**: Records the exact version of each installed package.
- **`package.json`**: Contains metadata about the project and its dependencies.
- **`public/`**: Contains static assets that are not processed by the build system.
  - **`favicon.ico`**: The favicon of the application.
  - **`sampleData.json`**: Sample data for the application.
- **`src/`**: Contains the source code of the application.
- **`tsconfig.*.json`**: TypeScript configuration files.
- **`vite.config.ts`**: Configuration for Vite.
- **`vitest.config.ts`**: Configuration for Vitest.

## `src/` Directory

The `src` directory contains the main source code of the application.

- **`App.vue`**: The root component of the application.
- **`app.css`**: Global CSS file for the application.
- **`main.ts`**: The entry point of the application.
- **`assets/`**: Contains static assets that are processed by the build system.
- **`components/`**: Contains reusable Vue components.
  - **`BonusGraph.vue`**: Component for displaying the bonus graph.
  - **`BonusNode.vue`**: Component for displaying a single node in the bonus graph.
  - **`EditableDataTable.vue`**: Component for displaying and editing data in a table.
  - **`__tests__/`**: Contains tests for the components.
- **`router/`**: Contains the routing configuration.
  - **`index.ts`**: Defines the routes of the application.
- **`services/`**: Contains services for interacting with external APIs.
  - **`googleSheetsService.ts`**: Service for interacting with Google Sheets.
- **`stores/`**: Contains Pinia stores for state management.
  - **`bonusData.ts`**: Store for bonus data.
  - **`bonus_properties.ts`**: Store for bonus properties.
  - **`bonuses.ts`**: Store for bonuses.
  - **`config.ts`**: Store for application configuration.
- **`types/`**: Contains TypeScript type definitions.
  - **`Bonus.ts`**: Type definition for a bonus.
  - **`BonusData.ts`**: Type definition for bonus data.
- **`views/`**: Contains the views of the application.
  - **`ConfigView.vue`**: View for configuring the application.
  - **`HomeView.vue`**: The home view of the application.
  - **`SheetView.vue`**: View for displaying data from a Google Sheet.

## Interactions

- `main.ts` is the entry point of the application. It initializes Vue, Pinia, and the router, and mounts the root component `App.vue`.
- `App.vue` is the root component, which contains the main layout and the router view.
- The router in `src/router/index.ts` maps URLs to views in the `src/views/` directory.
- Views can use components from the `src/components/` directory.
- Components and views can use stores from the `src/stores/` directory to manage the application state.
- Stores can use services from the `src/services/` directory to interact with external APIs.
- The `googleSheetsService.ts` service is used to fetch data from Google Sheets.
- The fetched data is then stored in the Pinia stores and displayed in the views and components.
- The `BonusGraph.vue` and `BonusNode.vue` components are used to visualize the bonus data.
- The `EditableDataTable.vue` component is used to display and edit data in a table.
- The `ConfigView.vue` is used to configure the application, for example, by setting the Google Sheets API key.
- The `SheetView.vue` is used to display the data from a Google Sheet in a table.
