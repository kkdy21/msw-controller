// apps/my-playground/src/libs/msw/mswControl.ts (최종 수정본)

import { type SetupWorker, setupWorker } from "msw/browser";
import type { RequestHandler } from "msw";
import { localStorageAccessor, STORAGE_KEYS } from "./storage";
import type {
  MockHandlerGroup,
  MockHandlerInfo,
  MockHandlerItem,
} from "./types";
import { Logger, type LogLevel } from "./logger/Logger";
import { type MessageKey } from "./logger/messages";

export type HandlerEnabledState = Record<string, boolean>;

export interface MSWControllerConfig {
  enabled?: boolean;
  handlerGroups: MockHandlerGroup[];
  logLevel?: LogLevel;
}

export class MSWController {
  private isMSWenabled: boolean;
  private worker: SetupWorker | null = null;
  private initialHandlerStates: HandlerEnabledState = {};
  private runtimeHandlerConfig: HandlerEnabledState = {};
  private configInitialized = false;
  private mswWorkerStarted = false;
  private mockHandlerGroups: Record<string, MockHandlerGroup> = {};
  private logger: Logger;

  constructor(config: MSWControllerConfig) {
    this.isMSWenabled = config.enabled ?? false;
    this.logger = new Logger(config.logLevel);

    if (this.isMSWenabled) {
      config.handlerGroups.forEach((group) => {
        this.mockHandlerGroups[group.groupName] = group;
        Object.keys(group.handlers).forEach((handlerId) => {
          this.initialHandlerStates[handlerId] = true; //default true
        });
      });

      this.initializeRuntimeConfig();
      this.exposeControlToWindow();
    }
  }

  // --- 설정 관리 로직 ---
  private initializeRuntimeConfig(): void {
    if (this.configInitialized || !this.isMSWenabled) {
      return;
    }

    const storedConfig = localStorageAccessor.getItem<string>(
      STORAGE_KEYS.MSW_HANDLER_CONFIG
    );

    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig) as HandlerEnabledState;
        Object.keys(this.initialHandlerStates).forEach((id) => {
          this.runtimeHandlerConfig[id] =
            Object.prototype.hasOwnProperty.call(parsedConfig, id) &&
            typeof parsedConfig[id] === "boolean"
              ? parsedConfig[id]
              : this.initialHandlerStates[id];
        });
        this.logger.log(
          "LOADED_RUNTIME_CONFIG_FROM_STORAGE",
          {},
          this.runtimeHandlerConfig
        );
      } catch (e) {
        this.logger.warn("STORAGE_PARSE_FAILED", {}, e);
        this.runtimeHandlerConfig = { ...this.initialHandlerStates };
      }
    } else {
      this.runtimeHandlerConfig = { ...this.initialHandlerStates };
      this.logger.log(
        "INITIALIZED_RUNTIME_CONFIG_FROM_CODE",
        {},
        this.runtimeHandlerConfig
      );
    }
    localStorageAccessor.setItem(
      STORAGE_KEYS.MSW_HANDLER_CONFIG,
      JSON.stringify(this.runtimeHandlerConfig)
    );
    this.configInitialized = true;
  }

  private isHandlerEnabled(handlerId: string): boolean {
    if (!this.isMSWenabled) return false;
    if (!this.configInitialized) {
      return this.initialHandlerStates[handlerId] ?? true;
    }
    return (
      this.runtimeHandlerConfig[handlerId] ??
      this.initialHandlerStates[handlerId] ??
      true
    );
  }

  private setHandlerEnabled(handlerId: string, enabled: boolean): void {
    if (!this.isMSWenabled) return;
    if (!this.configInitialized) {
      this.logger.warn("CANNOT_CHANGE_SETTING_BEFORE_INIT");
      return;
    }
    if (
      Object.prototype.hasOwnProperty.call(this.runtimeHandlerConfig, handlerId)
    ) {
      this.runtimeHandlerConfig[handlerId] = enabled;
      localStorageAccessor.setItem(
        STORAGE_KEYS.MSW_HANDLER_CONFIG,
        JSON.stringify(this.runtimeHandlerConfig)
      );
    } else {
      this.logger.warn("CANNOT_CHANGE_UNKNOWN_HANDLER", { handlerId });
    }
  }

  private getConfiguredRequestHandlers(): RequestHandler[] {
    const activeRequestHandlers: RequestHandler[] = [];
    if (!this.isMSWenabled) return activeRequestHandlers;
    if (!this.configInitialized) {
      this.logger.warn("CANNOT_GET_HANDLERS_BEFORE_INIT");
      return [];
    }

    Object.values(this.mockHandlerGroups).forEach((group) => {
      Object.values(group.handlers).forEach((handler) => {
        if (this.isHandlerEnabled(handler.id)) {
          activeRequestHandlers.push(handler.handler);
        }
      });
    });
    return activeRequestHandlers;
  }

  private _getAllHandlerDetailsForConsole(): MockHandlerInfo[] {
    const details: MockHandlerInfo[] = [];
    if (!this.isMSWenabled) return details;

    Object.entries(this.mockHandlerGroups).forEach(([groupName, group]) => {
      Object.values(group.handlers).forEach((handlerInfo) => {
        details.push({
          groupName,
          id: handlerInfo.id,
          description: handlerInfo.description,
          enabled: this.isHandlerEnabled(handlerInfo.id),
        });
      });
    });

    return details.sort((a, b) => {
      if (a.groupName !== b.groupName)
        return a.groupName.localeCompare(b.groupName);
      return a.description.localeCompare(b.description);
    });
  }

  async start(): Promise<void> {
    if (this.mswWorkerStarted) {
      this.logger.log("WORKER_ALREADY_STARTED");
      return;
    }

    if (this.isMSWenabled) {
      if (!this.configInitialized) this.initializeRuntimeConfig();
      const activeHandlers = this.getConfiguredRequestHandlers();

      if (activeHandlers.length === 0) {
        this.logger.log("NO_ACTIVE_HANDLERS_NO_START");
        this.worker = null;
        this.mswWorkerStarted = false;
        if (window.mswControl) {
          this.logger.log("HOW_TO_ENABLE_HANDLERS_HINT");
        }
        return;
      }

      try {
        this.worker = setupWorker(...activeHandlers);
        await this.worker.start({ onUnhandledRequest: "bypass" });
        window.dispatchEvent(new CustomEvent("mswStateChanged"));
        this.mswWorkerStarted = true;
        this.logger.log("WORKER_STARTED", { count: activeHandlers.length });
      } catch (error) {
        this.logger.error("WORKER_START_FAILED", {}, error);
        this.worker = null;
        this.mswWorkerStarted = false;
      }
    }
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.stop();
      this.worker = null;
      this.mswWorkerStarted = false;
      this.logger.log("WORKER_STOPPED");
    }
  }

  async reinitialize(): Promise<void> {
    if (!this.isMSWenabled) return;
    this.logger.log("WORKER_REINITIALIZING");
    await this.stop();
    await this.start();
    if (this.mswWorkerStarted) {
      this.logger.log("WORKER_REINITIALIZED");
    } else {
      this.logger.log("WORKER_NOT_STARTED_AFTER_REINIT");
    }
    this.logger.log("BROADCASTING_MSW_STATE_CHANGED");
  }

  isWorkerRunning(): boolean {
    return this.worker !== null && this.mswWorkerStarted;
  }

  // --- 콘솔 인터페이스 노출 로직 ---
  private exposeControlToWindow(): void {
    if (!this.isMSWenabled) return;

    const getHandlerInfo = (handlerId: string) =>
      this._getAllHandlerDetailsForConsole().find((d) => d.id === handlerId);

    const mswControlObject = {
      enableHandler: async (handlerId: string) => {
        const handlerInfo = getHandlerInfo(handlerId);
        if (!handlerInfo) {
          this.logger.warn("HANDLER_ID_NOT_FOUND", { handlerId });
          return;
        }
        this.setHandlerEnabled(handlerId, true);
        this.logger.log("HANDLER_ENABLED_REINIT", {
          description: handlerInfo.description,
          id: handlerId,
        });
        await this.reinitialize();
        this.logger.log("MSW_REINIT_COMPLETE");
      },
      disableHandler: async (handlerId: string) => {
        const handlerInfo = getHandlerInfo(handlerId);
        if (!handlerInfo) {
          this.logger.warn("HANDLER_ID_NOT_FOUND", { handlerId });
          return;
        }
        this.setHandlerEnabled(handlerId, false);
        this.logger.log("HANDLER_DISABLED_REINIT", {
          description: handlerInfo.description,
          id: handlerId,
        });
        await this.reinitialize();
        this.logger.log("MSW_REINIT_COMPLETE");
      },
      isHandlerEnabled: (handlerId: string) => {
        const handlerInfo = getHandlerInfo(handlerId);
        if (!handlerInfo) {
          this.logger.warn("HANDLER_ID_NOT_FOUND", { handlerId });
          return undefined;
        }
        const enabled = this.isHandlerEnabled(handlerId);
        const status = (this.logger as any).messages.HANDLER_STATUS({
          description: handlerInfo.description,
          id: handlerId,
          status: enabled ? "ON" : "OFF",
        });
        this.logger.raw("log", status); // Use raw log for dynamic localized string
        return enabled;
      },
      listHandlers: () => {
        this.logger.raw(
          "log",
          (this.logger as any).messages.HANDLER_LIST_HEADER
        );
        const details = this._getAllHandlerDetailsForConsole();
        if (details.length === 0) {
          this.logger.raw(
            "log",
            (this.logger as any).messages.NO_HANDLERS_TO_SHOW
          );
          return;
        }
        const groupedHandlers = details.reduce((acc, handler) => {
          const group = handler.groupName || "기타";
          if (!acc[group]) acc[group] = [];
          acc[group].push(handler);
          return acc;
        }, {} as Record<string, typeof details>);

        Object.entries(groupedHandlers).forEach(([groupName, handlers]) => {
          this.logger.raw("log", `<${groupName}>`);
          handlers.forEach((detail) => {
            this.logger.raw(
              "log",
              `  - ${detail.id.padEnd(15, " ")} | ${
                detail.enabled ? "ON " : "OFF"
              } | ${detail.description}`
            );
          });
        });
      },
      enableGroup: async (groupName: string) => {
        const group = this.mockHandlerGroups[groupName];
        if (!group) {
          this.logger.warn("GROUP_NOT_FOUND", { groupName });
          return;
        }
        this.logger.log("ENABLING_GROUP", { groupName });
        Object.values(group.handlers).forEach((handler) =>
          this.setHandlerEnabled(handler.id, true)
        );
        await this.reinitialize();
        this.logger.log("GROUP_ENABLED", { groupName });
      },
      disableGroup: async (groupName: string) => {
        const group = this.mockHandlerGroups[groupName];
        if (!group) {
          this.logger.warn("GROUP_NOT_FOUND", { groupName });
          return;
        }
        this.logger.log("DISABLING_GROUP", { groupName });
        Object.values(group.handlers).forEach((handler) =>
          this.setHandlerEnabled(handler.id, false)
        );
        await this.reinitialize();
        this.logger.log("GROUP_DISABLED", { groupName });
      },
      enableAllHandlers: async () => {
        this.logger.log("ENABLE_ALL_HANDLERS");
        Object.keys(this.runtimeHandlerConfig).forEach((id) =>
          this.setHandlerEnabled(id, true)
        );
        await this.reinitialize();
        this.logger.log("ENABLE_ALL_HANDLERS_COMPLETE");
      },
      disableAllHandlers: async () => {
        this.logger.log("DISABLE_ALL_HANDLERS");
        Object.keys(this.runtimeHandlerConfig).forEach((id) =>
          this.setHandlerEnabled(id, false)
        );
        await this.reinitialize();
        this.logger.log("DISABLE_ALL_HANDLERS_COMPLETE");
      },
      getCurrentConfig: () => {
        this.logger.log("GET_CURRENT_CONFIG", {}, this.runtimeHandlerConfig);
        return { ...this.runtimeHandlerConfig };
      },
      saveConfigToLocalStorage: async () => {
        localStorageAccessor.setItem(
          STORAGE_KEYS.MSW_HANDLER_CONFIG,
          JSON.stringify(this.runtimeHandlerConfig)
        );
        this.logger.log(
          "SAVE_CONFIG_TO_STORAGE",
          {},
          this.runtimeHandlerConfig
        );
      },
      loadConfigFromLocalStorage: async () => {
        this.logger.log("LOAD_CONFIG_FROM_STORAGE");
        this.configInitialized = false;
        this.initializeRuntimeConfig();
        this.logger.log("LOAD_CONFIG_FROM_STORAGE_COMPLETE");
        await this.reinitialize();
      },
      resetToInitialCodeConfig: async () => {
        this.logger.log("RESET_TO_INITIAL_CONFIG");
        this.runtimeHandlerConfig = { ...this.initialHandlerStates };
        localStorageAccessor.setItem(
          STORAGE_KEYS.MSW_HANDLER_CONFIG,
          JSON.stringify(this.runtimeHandlerConfig)
        );
        this.configInitialized = true;
        this.logger.log(
          "RESET_TO_INITIAL_CONFIG_COMPLETE",
          {},
          this.runtimeHandlerConfig
        );
        await this.reinitialize();
      },
      isWorkerRunning: () => {
        const running = this.isWorkerRunning();
        this.logger.log("WORKER_IS_RUNNING_STATUS", { status: running });
        return running;
      },
      getHandlers: (): MockHandlerInfo[] => {
        return this._getAllHandlerDetailsForConsole();
      },
      help: () => {
        const logKey = (key: MessageKey) =>
          this.logger.raw("log", (this.logger as any).messages[key]);
        logKey("HELP_GUIDE_HEADER");
        logKey("HELP_GUIDE_INTRO");
        logKey("HELP_GUIDE_EXAMPLES");
        logKey("HELP_LIST_HANDLERS");
        logKey("HELP_ENABLE_HANDLER");
        logKey("HELP_DISABLE_HANDLER");
        logKey("HELP_ENABLE_GROUP");
        logKey("HELP_DISABLE_GROUP");
        logKey("HELP_ENABLE_ALL");
        logKey("HELP_DISABLE_ALL");
        logKey("HELP_GET_CONFIG");
        logKey("HELP_SAVE_CONFIG");
        logKey("HELP_LOAD_CONFIG");
        logKey("HELP_RESET_CONFIG");
        logKey("HELP_CONFIG_SOURCE_INFO");
        logKey("HELP_RUNTIME_CHANGES_INFO");
      },
    };

    window.mswControl = mswControlObject;
    this.logger.log("CONTROLLER_READY_HINT");
  }
}
