import type { HandlerEnabledState } from "./mswController";

declare global {
  interface Window {
    mswControl?: {
      enableHandler: (handlerId: string) => Promise<void>;
      disableHandler: (handlerId: string) => Promise<void>;
      isHandlerEnabled: (handlerId: string) => boolean | undefined;
      listHandlers: () => void;
      enableAllHandlers: () => Promise<void>;
      disableAllHandlers: () => Promise<void>;
      enableGroup: (groupId: string) => Promise<void>;
      disableGroup: (groupId: string) => Promise<void>;
      getCurrentConfig: () => HandlerEnabledState;
      saveConfigToLocalStorage: () => Promise<void>;
      loadConfigFromLocalStorage: () => Promise<void>;
      resetToInitialCodeConfig: () => Promise<void>;
      isWorkerRunning: () => boolean;
      help: () => void;
    };
  }
}
