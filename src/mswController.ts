import { type SetupWorker, setupWorker } from "msw/browser";
import type { RequestHandler } from "msw";
import { localStorageAccessor, STORAGE_KEYS } from "./storage";
import type {
  MockHandlerItem,
  MockHandlerGroup,
  MockHandlerInfo,
} from "./types";
type HandlerEnabledState = Record<string, boolean>;

export interface MSWControllerConfig {
  enabled?: boolean; //사용하는곳에서 msw 실행여부 결정
  handlerGroups: MockHandlerGroup[];
}

class MSWController {
  private isMSWenabled: boolean;
  private worker: SetupWorker | null = null;
  private initialHandlerStates: HandlerEnabledState = {};
  private runtimeHandlerConfig: HandlerEnabledState = {};
  private configInitialized = false; // 전체 설정 및 콘솔 인터페이스 초기화 여부
  private mswWorkerStarted = false; // 순수 MSW 워커 시작 여부
  private mockHandlerGroups: Record<string, MockHandlerGroup> = {};
  constructor(config: MSWControllerConfig) {
    this.isMSWenabled = config.enabled ?? false;

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

  // --- 설정 관리 로직  ---
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
          if (
            Object.prototype.hasOwnProperty.call(parsedConfig, id) &&
            typeof parsedConfig[id] === "boolean"
          ) {
            this.runtimeHandlerConfig[id] = parsedConfig[id];
          } else {
            this.runtimeHandlerConfig[id] = this.initialHandlerStates[id];
          }
        });
        console.log(
          "[MSW Controller] localStorage에서 런타임 설정을 로드했습니다:",
          this.runtimeHandlerConfig
        );
      } catch (e) {
        console.warn(
          "[MSW Controller] localStorage 설정 파싱 실패. 코드 레벨 초기값을 사용합니다.",
          e
        );
        this.runtimeHandlerConfig = { ...this.initialHandlerStates };
      }
    } else {
      this.runtimeHandlerConfig = { ...this.initialHandlerStates };
      console.log(
        "[MSW Controller] 코드 레벨 초기값으로 런타임 설정을 초기화했습니다:",
        this.runtimeHandlerConfig
      );
    }
    // 초기화된 설정을 바로 localStorage에 저장
    localStorageAccessor.setItem(
      STORAGE_KEYS.MSW_HANDLER_CONFIG,
      JSON.stringify(this.runtimeHandlerConfig)
    );
    this.configInitialized = true;
  }

  private isHandlerEnabled(handlerId: string): boolean {
    if (!this.isMSWenabled) return false;

    // 만약 초기화 전 접근 시도를 더 엄격히 제어하려면 각 공개 메서드 시작 시 체크.
    if (!this.configInitialized) {
      // 아직 초기화 전이라면 코드 레벨의 기본값을 반환
      return this.initialHandlerStates[handlerId] === undefined
        ? true
        : this.initialHandlerStates[handlerId];
    }
    return typeof this.runtimeHandlerConfig[handlerId] === "boolean"
      ? this.runtimeHandlerConfig[handlerId]
      : this.initialHandlerStates[handlerId]; // runtime에 없으면 코드 레벨 초기값 참조
  }

  private setHandlerEnabled(handlerId: string, enabled: boolean): void {
    if (!this.isMSWenabled) return;
    if (!this.configInitialized) {
      console.warn(
        "[MSW Controller] 아직 초기화되지 않아 설정을 변경할 수 없습니다."
      );
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
      console.warn(
        `[MSW Controller] 알 수 없는 핸들러 ID '${handlerId}'의 상태를 변경할 수 없습니다.`
      );
    }
  }

  private getConfiguredRequestHandlers(): RequestHandler[] {
    const activeRequestHandlers: RequestHandler[] = [];
    if (!this.isMSWenabled) return activeRequestHandlers;
    if (!this.configInitialized) {
      console.warn(
        "[MSW Controller] 아직 초기화되지 않아 핸들러 목록을 가져올 수 없습니다."
      );
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

    const isEnabled = (groupName: string, handlerId: string): boolean => {
      const group = this.mockHandlerGroups[groupName];

      if (!group) {
        return false;
      }

      const sourceConfig = this.configInitialized
        ? this.runtimeHandlerConfig
        : this.initialHandlerStates;

      return typeof sourceConfig[handlerId] === "boolean"
        ? sourceConfig[handlerId]
        : this.initialHandlerStates[handlerId] || false;
    };
    Object.entries(this.mockHandlerGroups).forEach(
      ([groupName, group]: [string, MockHandlerGroup]) => {
        Object.values(group.handlers).forEach(
          (handlerInfo: MockHandlerItem) => {
            details.push({
              groupName,
              id: handlerInfo.id,
              description: handlerInfo.description,
              enabled: isEnabled(groupName, handlerInfo.id),
            });
          }
        );
      }
    );
    return details.sort((a, b) => {
      if (a.groupName !== b.groupName)
        return a.groupName.localeCompare(b.groupName);
      return a.description.localeCompare(b.description);
    });
  }

  async start(): Promise<void> {
    if (this.mswWorkerStarted) {
      console.log("[MSW Controller] 워커가 이미 시작된 상태입니다.");
      return;
    }

    if (this.isMSWenabled) {
      // initializeRuntimeConfig는 생성자에서 호출되므로 여기서는 ensure 정도로만.
      if (!this.configInitialized) this.initializeRuntimeConfig();

      const activeHandlers = this.getConfiguredRequestHandlers();

      if (activeHandlers.length === 0) {
        console.log(
          "[MSW Controller] 활성화된 핸들러가 없습니다. MSW 워커를 시작하지 않습니다."
        );
        this.worker = null; // 명시적으로 null
        this.mswWorkerStarted = false;
        if (window.mswControl) {
          console.log(
            "[MSW Control] 'mswControl.enableHandler(\"핸들러ID\")' 또는 'mswControl.enableAllHandlers()'로 핸들러를 활성화할 수 있습니다."
          );
        }
        return;
      }

      try {
        this.worker = setupWorker(...activeHandlers);
        await this.worker.start({
          onUnhandledRequest: "bypass",
        });
        this.mswWorkerStarted = true;
        console.log(
          `[MSW Controller] 워커 시작됨 (${activeHandlers.length}개 핸들러 활성화).`
        );
      } catch (error) {
        console.error("[MSW Controller] MSW 워커 시작 실패:", error);
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
      console.log("[MSW Controller] 워커가 중지되었습니다.");
    }
  }

  async reinitialize(): Promise<void> {
    if (!this.isMSWenabled) return;
    console.log("[MSW Controller] 워커 재초기화 중...");
    await this.stop();
    await this.start(); // 내부적으로 getConfiguredRequestHandlers를 호출하여 최신 설정 반영
    if (this.mswWorkerStarted) {
      console.log("[MSW Controller] 워커 재초기화 완료.");
    } else {
      // start 메서드에서 이미 로그를 남기므로, 여기서는 추가 로그가 필요 없을 수 있음
      console.log(
        "[MSW Controller] 재초기화 후 워커가 시작되지 않음 (활성화된 핸들러가 없을 수 있음)."
      );
    }

    // MSW 상태가 변경되었음을 window에 알립니다.DevTools 확장이 이 이벤트를 수신합니다.
    console.log(
      "[MSW Controller] 'mswStateChanged' 이벤트를 브로드캐스트합니다."
    );
    window.dispatchEvent(new CustomEvent("mswStateChanged"));
  }

  isWorkerRunning(): boolean {
    return this.worker !== null && this.mswWorkerStarted;
  }

  // --- 콘솔 인터페이스 노출 로직 ---
  private exposeControlToWindow(): void {
    if (!this.isMSWenabled) return;

    const mswControlObject = {
      enableHandler: async (handlerId: string) => {
        if (!this.configInitialized) {
          this.initializeRuntimeConfig();
        }
        const handlerInfo = this._getAllHandlerDetailsForConsole().find(
          (d) => d.id === handlerId
        );
        if (!handlerInfo) {
          console.warn(
            `[MSW Control] 핸들러 ID '${handlerId}'를 찾을 수 없습니다.`
          );
          return;
        }
        this.setHandlerEnabled(handlerId, true);
        console.log(
          `[MSW Control] 핸들러 '${handlerInfo.description}' (ID: ${handlerId}) 활성화됨. MSW 재초기화 중...`
        );
        await this.reinitialize();
        console.log(`[MSW Control] MSW 재초기화 완료.`);
      },
      disableHandler: async (handlerId: string) => {
        if (!this.configInitialized) {
          this.initializeRuntimeConfig();
        }
        const handlerInfo = this._getAllHandlerDetailsForConsole().find(
          (d) => d.id === handlerId
        );
        if (!handlerInfo) {
          console.warn(
            `[MSW Control] 핸들러 ID '${handlerId}'를 찾을 수 없습니다.`
          );
          return;
        }
        this.setHandlerEnabled(handlerId, false);
        console.log(
          `[MSW Control] 핸들러 '${handlerInfo.description}' (ID: ${handlerId}) 비활성화됨. MSW 재초기화 중...`
        );
        await this.reinitialize();
        console.log(`[MSW Control] MSW 재초기화 완료.`);
      },

      isHandlerEnabled: (handlerId: string) => {
        if (!this.configInitialized) {
          this.initializeRuntimeConfig();
        }
        const handlerInfo = this._getAllHandlerDetailsForConsole().find(
          (d) => d.id === handlerId
        );
        if (!handlerInfo) {
          console.warn(
            `[MSW Control] 핸들러 ID '${handlerId}'를 찾을 수 없습니다.`
          );
          return undefined;
        }
        const enabled = this.isHandlerEnabled(handlerId); // 클래스 내부 메서드 사용
        console.log(
          `[MSW Control] 핸들러 '${
            handlerInfo.description
          }' (ID: ${handlerId}) 상태: ${enabled ? "활성화됨" : "비활성화됨"}`
        );
        return enabled;
      },
      listHandlers: () => {
        if (!this.configInitialized) {
          this.initializeRuntimeConfig();
        }
        console.log("[MSW Control] 사용 가능한 핸들러 목록 (ID | 상태 | 설명)");
        const details = this._getAllHandlerDetailsForConsole();
        if (details.length === 0) {
          console.log("  (표시할 핸들러가 없습니다.)");
          return;
        }

        // 그룹별로 핸들러 정리
        const groupedHandlers = details.reduce((acc, handler) => {
          const group = handler.groupName || "기타";
          if (!acc[group]) {
            acc[group] = [];
          }
          acc[group].push(handler);
          return acc;
        }, {} as Record<string, typeof details>);

        // 그룹별로 출력
        Object.entries(groupedHandlers).forEach(([groupName, handlers]) => {
          console.log(`<${groupName}>`);
          handlers.forEach((detail) => {
            console.log(
              `  - ${detail.id.padEnd(15, " ")} | ${
                detail.enabled ? "ON " : "OFF"
              } | ${detail.description}`
            );
          });
        });
      },
      enableGroup: async (groupName: string) => {
        if (!this.configInitialized) {
          this.initializeRuntimeConfig();
        }

        const group = this.mockHandlerGroups[groupName];
        if (!group) {
          console.warn(`[MSW Control] 그룹 '${groupName}'를 찾을 수 없습니다.`);
          return;
        }
        console.log(`[MSW Control] ${groupName} 그룹 활성화 중...`);

        Object.values(group.handlers).forEach((handler) => {
          this.setHandlerEnabled(handler.id, true);
        });
        await this.reinitialize();
        console.log(`[MSW Control] ${groupName} 그룹 활성화 완료.`);
      },
      disableGroup: async (groupName: string) => {
        if (!this.configInitialized) {
          this.initializeRuntimeConfig();
        }
        const group = this.mockHandlerGroups[groupName];
        if (!group) {
          console.warn(`[MSW Control] 그룹 '${groupName}'를 찾을 수 없습니다.`);
          return;
        }

        console.log(`[MSW Control] ${groupName} 그룹 비활성화 중...`);
        if (group) {
          Object.values(group.handlers).forEach((handler) => {
            this.setHandlerEnabled(handler.id, false);
          });
          await this.reinitialize();
          console.log(`[MSW Control] ${groupName} 그룹 비활성화 완료.`);
        }
      },
      enableAllHandlers: async () => {
        if (!this.configInitialized) {
          this.initializeRuntimeConfig();
        }
        console.log("[MSW Control] 모든 핸들러 활성화 중...");
        Object.keys(this.runtimeHandlerConfig).forEach((id) =>
          this.setHandlerEnabled(id, true)
        );
        await this.reinitialize();
        console.log("[MSW Control] 모든 핸들러 활성화 및 MSW 재초기화 완료.");
      },
      disableAllHandlers: async () => {
        if (!this.configInitialized) {
          this.initializeRuntimeConfig();
        }
        console.log("[MSW Control] 모든 핸들러 비활성화 중...");
        Object.keys(this.runtimeHandlerConfig).forEach((id) =>
          this.setHandlerEnabled(id, false)
        );
        await this.reinitialize();
        console.log("[MSW Control] 모든 핸들러 비활성화 및 MSW 재초기화 완료.");
      },
      getCurrentConfig: () => {
        if (!this.configInitialized) {
          this.initializeRuntimeConfig();
        }
        console.log(
          "[MSW Control] 현재 적용된 핸들러 설정 (메모리 기준):",
          this.runtimeHandlerConfig
        );
        return { ...this.runtimeHandlerConfig };
      },
      saveConfigToLocalStorage: async () => {
        if (!this.configInitialized) {
          this.initializeRuntimeConfig();
        }
        await localStorageAccessor.setItem(
          STORAGE_KEYS.MSW_HANDLER_CONFIG,
          JSON.stringify(this.runtimeHandlerConfig)
        );
        console.log(
          "[MSW Control] 현재 핸들러 설정을 localStorage에 저장했습니다.",
          this.runtimeHandlerConfig
        );
      },
      loadConfigFromLocalStorage: async () => {
        console.log("[MSW Control] localStorage에서 설정 재로드 시도 중...");
        this.configInitialized = false; // 강제 재로드 플래그
        this.initializeRuntimeConfig(); // localStorage 우선 로드 로직 실행
        console.log(
          "[MSW Control] 설정 재로드 완료. 'mswControl.listHandlers()'로 확인하세요."
        );
        await this.reinitialize();
      },
      resetToInitialCodeConfig: async () => {
        console.log("[MSW Control] 코드 레벨 초기 설정으로 리셋 중...");
        this.runtimeHandlerConfig = { ...this.initialHandlerStates };
        localStorageAccessor.setItem(
          STORAGE_KEYS.MSW_HANDLER_CONFIG,
          JSON.stringify(this.runtimeHandlerConfig)
        );
        this.configInitialized = true; // 이미 초기화된 것으로 간주 (initialHandlerStates로)
        console.log(
          "[MSW Control] 코드 레벨 초기 설정으로 리셋 완료:",
          this.runtimeHandlerConfig
        );
        await this.reinitialize();
      },
      isWorkerRunning: () => {
        const running = this.isWorkerRunning(); // 클래스 내부 메서드 사용
        console.log(`[MSW Control] 워커 실행 상태: ${running}`);
        return running;
      },
      getHandlers: (): MockHandlerInfo[] => {
        if (!this.configInitialized) {
          this.initializeRuntimeConfig();
        }
        return this._getAllHandlerDetailsForConsole();
      },
      help: () => {
        if (this.isMSWenabled) {
          console.log("--- MSW 개발 모드 안내 ---");
          console.log(
            "개발자 콘솔에서 'mswControl' 객체를 사용하여 모킹 핸들러를 제어할 수 있습니다."
          );
          console.log("사용 예시:");
          console.log(
            "  mswControl.listHandlers()        - 모든 핸들러와 현재 상태 보기"
          );
          console.log(
            "  mswControl.enableHandler('ID')   - 특정 ID의 핸들러 활성화"
          );
          console.log(
            "  mswControl.disableHandler('ID')  - 특정 ID의 핸들러 비활성화"
          );
          console.log(
            "  mswControl.enableAllHandlers()   - 모든 핸들러 활성화"
          );
          console.log(
            "  mswControl.disableAllHandlers()  - 모든 핸들러 비활성화"
          );
          console.log(
            "  mswControl.getCurrentConfig()    - 현재 메모리 설정 보기"
          );
          console.log(
            "  mswControl.saveConfigToLocalStorage() - 현재 설정을 localStorage에 저장"
          );
          console.log(
            "  mswControl.loadConfigFromLocalStorage() - localStorage에서 설정 로드 (주의: 현재 변경사항 덮어씀)"
          );
          console.log(
            "  mswControl.resetToInitialCodeConfig() - 코드 레벨 초기 설정으로 리셋"
          );
          console.log(
            "초기 핸들러 활성화 상태는 'src/libs/msw/mswConfig.ts'의 'initialHandlerStates' 객체에 정의되어 있습니다."
          );
          console.log(
            "런타임 변경 사항은 'mswControl.saveConfigToLocalStorage()' 호출 시 localStorage에 저장되어 세션 간 유지될 수 있습니다."
          );
        }
      },
    };
    window.mswControl = mswControlObject;
    console.log(
      "[MSW Controller] 콘솔에서 'mswControl.listHandlers()'를 입력하여 사용 가능한 핸들러를 확인하세요."
    );
  }
}
