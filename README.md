# Balanciago

Balanciago is a web application designed for game designers to visualize, create, and manage systems of game bonuses and their intricate dependencies. It provides a clear graphical interface to understand and organize how different player abilities or improvements are interconnected.

## Core Features

*   **Bonus Graph Visualization:** Displays game bonuses as nodes and their dependencies as connecting lines in an interactive graph.
*   **Draggable Nodes:** Allows designers to easily rearrange bonus nodes on the canvas for a custom and clear layout.
*   **Detailed Bonus Representation:** Each bonus node clearly shows its name and a description of its effect or properties.
*   **Dependency Mapping:** Visually represents how certain bonuses require others to be unlocked, or how one bonus can lead to multiple new ones.
*   **Data-Driven:** Bonus data, including names, descriptions, and relationships, is managed within the application (with initial data provided for demonstration).
*   **Future Enhancements (as per TECH_SPEC.md):**
    *   Full CRUD (Create, Read, Update, Delete) operations for bonuses directly within the interface.
    *   Ability to edit connections (dependencies) between bonuses.
    *   Saving and loading of bonus configurations.
    *   Canvas manipulation features like zooming and panning.
    *   Exporting bonus configurations to game engine-friendly formats (e.g., JSON).
    *   Advanced graph layout algorithms and line routing.

## Logical Entities

*   **Bonus:** The fundamental unit within Balanciago. Each bonus has the following attributes:
    *   `id`: A unique identifier (e.g., 'strength-boost-1').
    *   `name`: The display name of the bonus.
    *   `description`: A text explaining the bonus's effect.
    *   `dependencies`: An array of IDs of other bonuses that must be acquired before this bonus becomes available.
    *   `unlocks`: An array of IDs of other bonuses that this bonus makes accessible (primarily for data organization, graph edges are typically derived from `dependencies`).
    *   `x`, `y`: Coordinates defining the bonus node's initial position on the graph canvas.
*   **Bonus Graph:** The main interactive area where bonuses and their relationships are visualized.
*   **Nodes:** The visual representation of individual `Bonus` entities within the graph.
*   **Edges (Connections):** Lines that connect bonus nodes, visually representing the `dependencies` between them. An arrow indicates the direction of dependency (from the prerequisite bonus to the dependent bonus).

## Technology Stack

*   **Vue 3:** A progressive JavaScript framework for building user interfaces.
*   **Vite:** A fast build tool and development server for modern web projects.
*   **Pinia:** A state management solution for Vue.js applications.
*   **@vue-flow/core:** A Vue 3 library for building node-based editors and interactive diagrams.
*   **TypeScript:** For type safety and improved developer experience.

## Google Sheets Demo

The application also includes a demonstration page (`/sheet`) showcasing integration with Google Sheets. This feature allows for:

*   Authenticating with a Google account.
*   Reading data from a specified Google Sheet.
*   Writing data to a specified Google Sheet, including an example of fetching data from a local JSON file (`public/sampleData.json`) and populating a sheet with it.

This Sheets integration is separate from the core bonus graph functionality but demonstrates capabilities for potential future data import/export workflows.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
