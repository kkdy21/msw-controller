# MSW Controller

A TypeScript library for dynamically managing MSW (Mock Service Worker) handlers in the browser.

![npm version](https://badge.fury.io/js/msw-controller.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Key Features

- 🎛️ **Dynamic Handler Management**: Enable/disable MSW handlers at runtime.
- 📂 **Group-based Management**: Organize and manage handlers in logical groups.
- 💾 **State Persistence**: Save and restore handler states using local storage.
- 🛠️ **Developer Tools**: Convenient API available in the browser console.
- 🔄 **Real-time Changes**: Modify handler states without a page refresh.
- 📝 **Detailed Logging**: A useful logging system for development.

## 🚀 MSW DevTools Extension (Coming Soon)

For an even better development experience, we are preparing an **MSW DevTools Controller** Chrome extension. This extension will allow you to manage MSW handlers through an intuitive UI within the browser's developer tools.

- **GUI-based Control**: Enable/disable handlers and groups with a click, no console commands needed.
- **Real-time Status Check**: Instantly see which handlers are currently active.
- **Easy Debugging**: Improve debugging efficiency by easily controlling specific API mock responses in complex scenarios.

Stay tuned for the release!

## Installation

```bash
npm install msw-controller

# or
yarn add msw-controller

# or
pnpm add msw-controller
```

## Requirements

- MSW 2.8.4 or higher
- Browser environment

## Basic Usage

### 1. Define Handler Groups

```typescript
import { MSWController } from "msw-controller";
import { http, HttpResponse } from "msw";

const handlerGroups = [
  {
    id: "user-api",
    groupName: "User API",
    description: "User related API mocks",
    handlers: {
      "get-user-profile": {
        id: "get-user-profile",
        description: "Get user profile",
        handler: http.get("/api/user/profile", () => {
          return HttpResponse.json({
            id: 1,
            name: "John Doe",
            email: "john@example.com",
          });
        }),
      },
      "update-user-profile": {
        id: "update-user-profile",
        description: "Update user profile",
        handler: http.patch("/api/user/profile", () => {
          return HttpResponse.json({ success: true });
        }),
      },
    },
  },
  {
    id: "posts-api",
    groupName: "Posts API",
    description: "Blog posts API mocks",
    handlers: {
      "get-posts": {
        id: "get-posts",
        description: "Get all posts",
        handler: http.get("/api/posts", () => {
          return HttpResponse.json([
            { id: 1, title: "First Post", content: "Hello World" },
            { id: 2, title: "Second Post", content: "MSW is awesome!" },
          ]);
        }),
      },
    },
  },
];
```

### 2. Initialize and Start the Controller

```typescript
// Create MSW Controller instance
const mswController = new MSWController({
  enabled: true,
  handlerGroups,
  logLevel: "info", // 'error' | 'warn' | 'info' | 'debug'
});

// Start MSW when the application starts
async function startApp() {
  await mswController.start();
  console.log("MSW has started!");

  // Start your React app or other application
  // ...
}

startApp();
```

## Browser Console API

MSW Controller provides a convenient browser console API for development.

```javascript
// Check status of all handlers
window.mswControl.status();

// Enable/disable a specific handler
window.mswControl.enable("get-user-profile");
window.mswControl.disable("get-user-profile");

// Control entire handler groups
window.mswControl.enableGroup("user-api");
window.mswControl.disableGroup("posts-api");

// Control all handlers
window.mswControl.enableAll();
window.mswControl.disableAll();

// Restart MSW (after changing settings)
window.mswControl.restart();

// View help
window.mswControl.help();
```

## API Reference

### MSWController

#### Constructor

```typescript
new MSWController(config: MSWControllerConfig)
```

#### MSWControllerConfig

```typescript
interface MSWControllerConfig {
  enabled?: boolean; // Whether to enable MSW (default: false)
  handlerGroups: MockHandlerGroup[]; // Array of handler groups
  logLevel?: LogLevel; // Log level (default: 'warn')
}
```

#### Key Methods

- `start(): Promise<void>` - Start the MSW worker
- `stop(): Promise<void>` - Stop the MSW worker
- `reinitialize(): Promise<void>` - Restart MSW after configuration changes
- `isWorkerRunning(): boolean` - Check if the MSW worker is running

### Type Definitions

```typescript
interface MockHandlerGroup {
  id: string;
  groupName: string;
  description: string;
  handlers: Record<string, MockHandlerItem>;
}

interface MockHandlerItem {
  id: string;
  description: string;
  handler: RequestHandler; // MSW's RequestHandler
}

type LogLevel = "error" | "warn" | "info" | "debug";
```

## Advanced Usage

### Usage with React

```typescript
// src/mocks/setup.ts
import { MSWController } from "msw-controller";
import { handlerGroups } from "./handlers";

export const mswController = new MSWController({
  enabled: process.env.NODE_ENV === "development",
  handlerGroups,
  logLevel: "info",
});

// src/main.tsx (or index.tsx)
import { mswController } from "./mocks/setup";

async function enableMocking() {
  if (process.env.NODE_ENV === "development") {
    await mswController.start();
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

### Conditional Handler Activation

```typescript
// Set handler groups differently based on a condition
const isDemoMode = new URLSearchParams(window.location.search).has("demo");

const mswController = new MSWController({
  enabled: true,
  handlerGroups: isDemoMode ? demoHandlerGroups : developmentHandlerGroups,
  logLevel: "info",
});
```

### Custom Event Listeners

```typescript
// Detect MSW state changes
window.addEventListener("mswStateChanged", () => {
  console.log("MSW state has changed.");
  // Perform actions like updating the UI
});
```

## Development

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/msw-controller.git
cd msw-controller

# Install dependencies
npm install

# Start development mode (watch mode)
npm run dev

# Build
npm run build
```

### Build Scripts

- `npm run build` - Production build (generates CJS, ESM, and type definition files)
- `npm run dev` - Development mode (watches for file changes)

## Troubleshooting

### Common Issues

1.  **MSW worker does not start**

    - Check for error messages in the browser's developer console.
    - Verify MSW version compatibility (requires 2.8.4 or higher).

2.  **Handlers are not being applied**

    - Check the handler status with `window.mswControl.status()`.
    - In the browser's network tab, confirm that requests are being intercepted.

3.  **Settings are not saved**
    - Ensure that local storage is enabled in the browser.
    - Settings may not be saved in incognito/private mode.

## Author

**Daeyeon KO**

## Changelog

### v1.1.1

- Stability improvements and bug fixes
- Improved logging system

### v1.1.0

- Added new console APIs
- Added group-based handler control feature

### v1.0.0

- Initial release
- Basic dynamic management of MSW handlers
