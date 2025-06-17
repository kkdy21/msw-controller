# MSW Controller

![npm version](https://badge.fury.io/js/msw-controller.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

A TypeScript library for dynamically managing MSW (Mock Service Worker) handlers in the browser.

브라우저에서 MSW(Mock Service Worker) 핸들러를 동적으로 관리하는 TypeScript 라이브러리입니다.

[English](#-english) | [한국어](#-korean)

---

## 🇬🇧 English

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

---

## 🇰🇷 Korean

## 주요 기능

- 🎛️ **동적 핸들러 관리**: 런타임에 MSW 핸들러를 활성화/비활성화
- 📂 **그룹별 관리**: 핸들러를 논리적 그룹으로 구성하여 관리
- 💾 **상태 저장**: 로컬 스토리지를 통한 핸들러 상태 저장 및 복원
- 🛠️ **개발자 도구**: 브라우저 콘솔에서 사용 가능한 편리한 API
- 🔄 **실시간 변경**: 페이지 새로고침 없이 핸들러 상태 변경
- 📝 **상세 로깅**: 개발 과정에서 유용한 로그 시스템

## 🚀 MSW DevTools 확장 프로그램 (출시 예정)

더욱 편리한 개발 경험을 위해 **MSW DevTools Controller** 크롬 확장 프로그램을 준비하고 있습니다. 이 확장 프로그램을 사용하면 브라우저 개발자 도구 내에서 직관적인 UI를 통해 MSW 핸들러를 관리할 수 있습니다.

- **GUI 기반 제어**: 콘솔 명령어를 입력할 필요 없이 클릭만으로 핸들러와 그룹을 활성화/비활성화할 수 있습니다.
- **실시간 상태 확인**: 현재 어떤 핸들러가 활성화되어 있는지 한눈에 파악할 수 있습니다.
- **간편한 디버깅**: 복잡한 시나리오에서 특정 API 모의 응답을 쉽게 제어하여 디버깅 효율을 높입니다.

출시 소식을 기대해주세요!

## 설치

```bash
npm install msw-controller

# 또는
yarn add msw-controller

# 또는
pnpm add msw-controller
```

## 요구사항

- MSW 2.8.4 이상
- 브라우저 환경

## 기본 사용법

### 1. 핸들러 그룹 정의

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

### 2. 컨트롤러 초기화 및 시작

```typescript
// MSW 컨트롤러 생성
const mswController = new MSWController({
  enabled: true,
  handlerGroups,
  logLevel: "info", // 'error' | 'warn' | 'info' | 'debug'
});

// 애플리케이션 시작 시 MSW 시작
async function startApp() {
  await mswController.start();
  console.log("MSW가 시작되었습니다!");

  // React 앱이나 다른 애플리케이션 시작
  // ...
}

startApp();
```

## 브라우저 콘솔 API

MSW Controller는 개발 과정에서 편리하게 사용할 수 있는 브라우저 콘솔 API를 제공합니다.

```javascript
// 모든 핸들러 상태 확인
window.mswControl.status();

// 특정 핸들러 활성화/비활성화
window.mswControl.enable("get-user-profile");
window.mswControl.disable("get-user-profile");

// 핸들러 그룹 전체 제어
window.mswControl.enableGroup("user-api");
window.mswControl.disableGroup("posts-api");

// 모든 핸들러 제어
window.mswControl.enableAll();
window.mswControl.disableAll();

// MSW 재시작 (설정 변경 후)
window.mswControl.restart();

// 도움말 보기
window.mswControl.help();
```

## API 참조

### MSWController

#### Constructor

```typescript
new MSWController(config: MSWControllerConfig)
```

#### MSWControllerConfig

```typescript
interface MSWControllerConfig {
  enabled?: boolean; // MSW 활성화 여부 (기본: false)
  handlerGroups: MockHandlerGroup[]; // 핸들러 그룹 배열
  logLevel?: LogLevel; // 로그 레벨 (기본: 'warn')
}
```

#### 주요 메서드

- `start(): Promise<void>` - MSW 워커 시작
- `stop(): Promise<void>` - MSW 워커 중지
- `reinitialize(): Promise<void>` - 설정 변경 후 MSW 재시작
- `isWorkerRunning(): boolean` - MSW 워커 실행 상태 확인

### 타입 정의

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
  handler: RequestHandler; // MSW의 RequestHandler
}

type LogLevel = "error" | "warn" | "info" | "debug";
```

## 고급 사용법

### React와 함께 사용하기

```typescript
// src/mocks/setup.ts
import { MSWController } from "msw-controller";
import { handlerGroups } from "./handlers";

export const mswController = new MSWController({
  enabled: process.env.NODE_ENV === "development",
  handlerGroups,
  logLevel: "info",
});

// src/main.tsx (또는 index.tsx)
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

### 조건부 핸들러 활성화

```typescript
// 특정 조건에 따라 핸들러 그룹을 다르게 설정
const isDemoMode = new URLSearchParams(window.location.search).has("demo");

const mswController = new MSWController({
  enabled: true,
  handlerGroups: isDemoMode ? demoHandlerGroups : developmentHandlerGroups,
  logLevel: "info",
});
```

### 사용자 정의 이벤트 리스너

```typescript
// MSW 상태 변경 감지
window.addEventListener("mswStateChanged", () => {
  console.log("MSW 상태가 변경되었습니다.");
  // UI 업데이트 등의 작업 수행
});
```

## 개발

### 로컬 개발 환경 설정

```bash
# 레포지토리 클론
git clone https://github.com/your-username/msw-controller.git
cd msw-controller

# 의존성 설치
npm install

# 개발 모드 시작 (watch mode)
npm run dev

# 빌드
npm run build
```

### 빌드 스크립트

- `npm run build` - 프로덕션 빌드 (CJS, ESM, 타입 정의 파일 생성)
- `npm run dev` - 개발 모드 (파일 변경 감지)

## 문제 해결

### 일반적인 문제들

1. **MSW 워커가 시작되지 않는 경우**

   - 브라우저 개발자 도구에서 에러 메시지 확인
   - MSW 버전 호환성 확인 (2.8.4 이상 필요)

2. **핸들러가 적용되지 않는 경우**

   - `window.mswControl.status()`로 핸들러 상태 확인
   - 브라우저 네트워크 탭에서 요청이 인터셉트되고 있는지 확인

3. **설정이 저장되지 않는 경우**
   - 브라우저의 로컬 스토리지가 활성화되어 있는지 확인
   - 시크릿 모드에서는 설정이 저장되지 않을 수 있습니다

## 작성자

**Daeyeon KO**

## 변경 로그

### v1.1.1

- 안정성 개선 및 버그 수정
- 로깅 시스템 개선

### v1.1.0

- 새로운 콘솔 API 추가
- 그룹별 핸들러 제어 기능 추가

### v1.0.0

- 초기 릴리스
- 기본적인 MSW 핸들러 동적 관리 기능
