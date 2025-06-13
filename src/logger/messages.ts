// src/logger/messages.ts

/**
 * 메시지에서 사용할 수 있는 파라미터 타입 정의
 * 예: { handlerId: 'my-handler' }
 */
type MessageParams = Record<string, string | number>;

/**
 * 모든 메시지에 대한 키 타입
 */
export type MessageKey =
  | "LOADED_RUNTIME_CONFIG_FROM_STORAGE"
  | "STORAGE_PARSE_FAILED"
  | "INITIALIZED_RUNTIME_CONFIG_FROM_CODE"
  | "CANNOT_CHANGE_SETTING_BEFORE_INIT"
  | "CANNOT_CHANGE_UNKNOWN_HANDLER"
  | "CANNOT_GET_HANDLERS_BEFORE_INIT"
  | "WORKER_ALREADY_STARTED"
  | "NO_ACTIVE_HANDLERS_NO_START"
  | "HOW_TO_ENABLE_HANDLERS_HINT"
  | "WORKER_STARTED"
  | "WORKER_START_FAILED"
  | "WORKER_STOPPED"
  | "WORKER_REINITIALIZING"
  | "WORKER_REINITIALIZED"
  | "WORKER_NOT_STARTED_AFTER_REINIT"
  | "BROADCASTING_MSW_STATE_CHANGED"
  | "HANDLER_ID_NOT_FOUND"
  | "HANDLER_ENABLED_REINIT"
  | "HANDLER_DISABLED_REINIT"
  | "MSW_REINIT_COMPLETE"
  | "HANDLER_STATUS"
  | "HANDLER_LIST_HEADER"
  | "NO_HANDLERS_TO_SHOW"
  | "GROUP_NOT_FOUND"
  | "ENABLING_GROUP"
  | "GROUP_ENABLED"
  | "DISABLING_GROUP"
  | "GROUP_DISABLED"
  | "ENABLE_ALL_HANDLERS"
  | "ENABLE_ALL_HANDLERS_COMPLETE"
  | "DISABLE_ALL_HANDLERS"
  | "DISABLE_ALL_HANDLERS_COMPLETE"
  | "GET_CURRENT_CONFIG"
  | "SAVE_CONFIG_TO_STORAGE"
  | "LOAD_CONFIG_FROM_STORAGE"
  | "LOAD_CONFIG_FROM_STORAGE_COMPLETE"
  | "RESET_TO_INITIAL_CONFIG"
  | "RESET_TO_INITIAL_CONFIG_COMPLETE"
  | "WORKER_IS_RUNNING_STATUS"
  | "HELP_GUIDE_HEADER"
  | "HELP_GUIDE_INTRO"
  | "HELP_GUIDE_EXAMPLES"
  | "HELP_LIST_HANDLERS"
  | "HELP_ENABLE_HANDLER"
  | "HELP_DISABLE_HANDLER"
  | "HELP_ENABLE_GROUP"
  | "HELP_DISABLE_GROUP"
  | "HELP_ENABLE_ALL"
  | "HELP_DISABLE_ALL"
  | "HELP_GET_CONFIG"
  | "HELP_SAVE_CONFIG"
  | "HELP_LOAD_CONFIG"
  | "HELP_RESET_CONFIG"
  | "HELP_CONFIG_SOURCE_INFO"
  | "HELP_RUNTIME_CHANGES_INFO"
  | "CONTROLLER_READY_HINT"
  | "UNKNOWN_GROUP_WARN";

export type Messages = Record<
  MessageKey,
  string | ((params: MessageParams) => string)
>;

// 한국어 메시지
export const MESSAGES_KO: Messages = {
  LOADED_RUNTIME_CONFIG_FROM_STORAGE:
    "[MSW Controller] localStorage에서 런타임 설정을 로드했습니다:",
  STORAGE_PARSE_FAILED:
    "[MSW Controller] localStorage 설정 파싱 실패. 코드 레벨 초기값을 사용합니다.",
  INITIALIZED_RUNTIME_CONFIG_FROM_CODE:
    "[MSW Controller] 코드 레벨 초기값으로 런타임 설정을 초기화했습니다:",
  CANNOT_CHANGE_SETTING_BEFORE_INIT:
    "[MSW Controller] 아직 초기화되지 않아 설정을 변경할 수 없습니다.",
  CANNOT_CHANGE_UNKNOWN_HANDLER: (p) =>
    `[MSW Controller] 알 수 없는 핸들러 ID '${p.handlerId}'의 상태를 변경할 수 없습니다.`,
  CANNOT_GET_HANDLERS_BEFORE_INIT:
    "[MSW Controller] 아직 초기화되지 않아 핸들러 목록을 가져올 수 없습니다.",
  WORKER_ALREADY_STARTED: "[MSW Controller] 워커가 이미 시작된 상태입니다.",
  NO_ACTIVE_HANDLERS_NO_START:
    "[MSW Controller] 활성화된 핸들러가 없습니다. MSW 워커를 시작하지 않습니다.",
  HOW_TO_ENABLE_HANDLERS_HINT:
    "[MSW Control] 'mswControl.enableHandler(\"핸들러ID\")' 또는 'mswControl.enableAllHandlers()'로 핸들러를 활성화할 수 있습니다.",
  WORKER_STARTED: (p) =>
    `[MSW Controller] 워커 시작됨 (${p.count}개 핸들러 활성화).`,
  WORKER_START_FAILED: "[MSW Controller] MSW 워커 시작 실패:",
  WORKER_STOPPED: "[MSW Controller] 워커가 중지되었습니다.",
  WORKER_REINITIALIZING: "[MSW Controller] 워커 재초기화 중...",
  WORKER_REINITIALIZED: "[MSW Controller] 워커 재초기화 완료.",
  WORKER_NOT_STARTED_AFTER_REINIT:
    "[MSW Controller] 재초기화 후 워커가 시작되지 않음 (활성화된 핸들러가 없을 수 있음).",
  BROADCASTING_MSW_STATE_CHANGED:
    "[MSW Controller] 'mswStateChanged' 이벤트를 브로드캐스트합니다.",
  HANDLER_ID_NOT_FOUND: (p) =>
    `[MSW Control] 핸들러 ID '${p.handlerId}'를 찾을 수 없습니다.`,
  HANDLER_ENABLED_REINIT: (p) =>
    `[MSW Control] 핸들러 '${p.description}' (ID: ${p.id}) 활성화됨. MSW 재초기화 중...`,
  HANDLER_DISABLED_REINIT: (p) =>
    `[MSW Control] 핸들러 '${p.description}' (ID: ${p.id}) 비활성화됨. MSW 재초기화 중...`,
  MSW_REINIT_COMPLETE: `[MSW Control] MSW 재초기화 완료.`,
  HANDLER_STATUS: (p) =>
    `[MSW Control] 핸들러 '${p.description}' (ID: ${p.id}) 상태: ${p.status}`,
  HANDLER_LIST_HEADER:
    "[MSW Control] 사용 가능한 핸들러 목록 (ID | 상태 | 설명)",
  NO_HANDLERS_TO_SHOW: "  (표시할 핸들러가 없습니다.)",
  GROUP_NOT_FOUND: (p) =>
    `[MSW Control] 그룹 '${p.groupName}'를 찾을 수 없습니다.`,
  ENABLING_GROUP: (p) => `[MSW Control] ${p.groupName} 그룹 활성화 중...`,
  GROUP_ENABLED: (p) => `[MSW Control] ${p.groupName} 그룹 활성화 완료.`,
  DISABLING_GROUP: (p) => `[MSW Control] ${p.groupName} 그룹 비활성화 중...`,
  GROUP_DISABLED: (p) => `[MSW Control] ${p.groupName} 그룹 비활성화 완료.`,
  ENABLE_ALL_HANDLERS: "[MSW Control] 모든 핸들러 활성화 중...",
  ENABLE_ALL_HANDLERS_COMPLETE:
    "[MSW Control] 모든 핸들러 활성화 및 MSW 재초기화 완료.",
  DISABLE_ALL_HANDLERS: "[MSW Control] 모든 핸들러 비활성화 중...",
  DISABLE_ALL_HANDLERS_COMPLETE:
    "[MSW Control] 모든 핸들러 비활성화 및 MSW 재초기화 완료.",
  GET_CURRENT_CONFIG: "[MSW Control] 현재 적용된 핸들러 설정 (메모리 기준):",
  SAVE_CONFIG_TO_STORAGE:
    "[MSW Control] 현재 핸들러 설정을 localStorage에 저장했습니다.",
  LOAD_CONFIG_FROM_STORAGE:
    "[MSW Control] localStorage에서 설정 재로드 시도 중...",
  LOAD_CONFIG_FROM_STORAGE_COMPLETE:
    "[MSW Control] 설정 재로드 완료. 'mswControl.listHandlers()'로 확인하세요.",
  RESET_TO_INITIAL_CONFIG: "[MSW Control] 코드 레벨 초기 설정으로 리셋 중...",
  RESET_TO_INITIAL_CONFIG_COMPLETE:
    "[MSW Control] 코드 레벨 초기 설정으로 리셋 완료:",
  WORKER_IS_RUNNING_STATUS: (p) => `[MSW Control] 워커 실행 상태: ${p.status}`,
  HELP_GUIDE_HEADER: "--- MSW 개발 모드 안내 ---",
  HELP_GUIDE_INTRO:
    "개발자 콘솔에서 'mswControl' 객체를 사용하여 모킹 핸들러를 제어할 수 있습니다.",
  HELP_GUIDE_EXAMPLES: "사용 예시:",
  HELP_LIST_HANDLERS:
    "  mswControl.listHandlers()        - 모든 핸들러와 현재 상태 보기",
  HELP_ENABLE_HANDLER:
    "  mswControl.enableHandler('ID')   - 특정 ID의 핸들러 활성화",
  HELP_DISABLE_HANDLER:
    "  mswControl.disableHandler('ID')  - 특정 ID의 핸들러 비활성화",
  HELP_ENABLE_ALL: "  mswControl.enableAllHandlers()   - 모든 핸들러 활성화",
  HELP_DISABLE_ALL: "  mswControl.disableAllHandlers()  - 모든 핸들러 비활성화",
  HELP_ENABLE_GROUP:
    "  mswControl.enableGroup('그룹ID')   - 특정 그룹의 핸들러 활성화",
  HELP_DISABLE_GROUP:
    "  mswControl.disableGroup('그룹ID')  - 특정 그룹의 핸들러 비활성화",
  HELP_GET_CONFIG: "  mswControl.getCurrentConfig()    - 현재 메모리 설정 보기",
  HELP_SAVE_CONFIG:
    "  mswControl.saveConfigToLocalStorage() - 현재 설정을 localStorage에 저장",
  HELP_LOAD_CONFIG:
    "  mswControl.loadConfigFromLocalStorage() - localStorage에서 설정 로드 (주의: 현재 변경사항 덮어씀)",
  HELP_RESET_CONFIG:
    "  mswControl.resetToInitialCodeConfig() - 코드 레벨 초기 설정으로 리셋",
  HELP_CONFIG_SOURCE_INFO:
    "초기 핸들러 활성화 상태는 컨트롤러 초기화 시 `handlerGroups` 설정에 의해 결정됩니다.",
  HELP_RUNTIME_CHANGES_INFO:
    "런타임 변경 사항은 자동으로 localStorage에 저장되어 세션 간 유지됩니다.",
  CONTROLLER_READY_HINT:
    "[MSW Controller] 콘솔에서 'mswControl.help()'를 입력하여 사용 가능한 명령어를 확인하세요.",
  UNKNOWN_GROUP_WARN: (p) =>
    `[MSW Control] 알 수 없는 그룹 '${p.groupName}' 입니다.`,
};

// 영어 메시지
export const MESSAGES_EN: Messages = {
  LOADED_RUNTIME_CONFIG_FROM_STORAGE:
    "[MSW Controller] Loaded runtime config from localStorage:",
  STORAGE_PARSE_FAILED:
    "[MSW Controller] Failed to parse localStorage config. Using code-level initial values.",
  INITIALIZED_RUNTIME_CONFIG_FROM_CODE:
    "[MSW Controller] Initialized runtime config with code-level initial values:",
  CANNOT_CHANGE_SETTING_BEFORE_INIT:
    "[MSW Controller] Cannot change settings before initialization.",
  CANNOT_CHANGE_UNKNOWN_HANDLER: (p) =>
    `[MSW Controller] Cannot change state of unknown handler ID '${p.handlerId}'.`,
  CANNOT_GET_HANDLERS_BEFORE_INIT:
    "[MSW Controller] Cannot get handler list before initialization.",
  WORKER_ALREADY_STARTED: "[MSW Controller] Worker is already started.",
  NO_ACTIVE_HANDLERS_NO_START:
    "[MSW Controller] No active handlers. MSW worker will not be started.",
  HOW_TO_ENABLE_HANDLERS_HINT:
    "[MSW Control] You can enable handlers via 'mswControl.enableHandler(\"handlerId\")' or 'mswControl.enableAllHandlers()'.",
  WORKER_STARTED: (p) =>
    `[MSW Controller] Worker started with ${p.count} active handlers.`,
  WORKER_START_FAILED: "[MSW Controller] Failed to start MSW worker:",
  WORKER_STOPPED: "[MSW Controller] Worker has been stopped.",
  WORKER_REINITIALIZING: "[MSW Controller] Reinitializing worker...",
  WORKER_REINITIALIZED: "[MSW Controller] Worker reinitialized.",
  WORKER_NOT_STARTED_AFTER_REINIT:
    "[MSW Controller] Worker not started after reinitialization (perhaps no active handlers).",
  BROADCASTING_MSW_STATE_CHANGED:
    "[MSW Controller] Broadcasting 'mswStateChanged' event.",
  HANDLER_ID_NOT_FOUND: (p) =>
    `[MSW Control] Handler ID '${p.handlerId}' not found.`,
  HANDLER_ENABLED_REINIT: (p) =>
    `[MSW Control] Handler '${p.description}' (ID: ${p.id}) enabled. Reinitializing MSW...`,
  HANDLER_DISABLED_REINIT: (p) =>
    `[MSW Control] Handler '${p.description}' (ID: ${p.id}) disabled. Reinitializing MSW...`,
  MSW_REINIT_COMPLETE: "[MSW Control] MSW reinitialization complete.",
  HANDLER_STATUS: (p) =>
    `[MSW Control] Handler '${p.description}' (ID: ${p.id}) status: ${p.status}`,
  HANDLER_LIST_HEADER:
    "[MSW Control] Available Handlers (ID | Status | Description)",
  NO_HANDLERS_TO_SHOW: "  (No handlers to display.)",
  GROUP_NOT_FOUND: (p) => `[MSW Control] Group '${p.groupName}' not found.`,
  ENABLING_GROUP: (p) => `[MSW Control] Enabling group ${p.groupName}...`,
  GROUP_ENABLED: (p) => `[MSW Control] Group ${p.groupName} enabled.`,
  DISABLING_GROUP: (p) => `[MSW Control] Disabling group ${p.groupName}...`,
  GROUP_DISABLED: (p) => `[MSW Control] Group ${p.groupName} disabled.`,
  ENABLE_ALL_HANDLERS: "[MSW Control] Enabling all handlers...",
  ENABLE_ALL_HANDLERS_COMPLETE:
    "[MSW Control] All handlers enabled and MSW reinitialized.",
  DISABLE_ALL_HANDLERS: "[MSW Control] Disabling all handlers...",
  DISABLE_ALL_HANDLERS_COMPLETE:
    "[MSW Control] All handlers disabled and MSW reinitialized.",
  GET_CURRENT_CONFIG:
    "[MSW Control] Current handler configuration (in memory):",
  SAVE_CONFIG_TO_STORAGE:
    "[MSW Control] Saved current handler configuration to localStorage.",
  LOAD_CONFIG_FROM_STORAGE:
    "[MSW Control] Attempting to reload config from localStorage...",
  LOAD_CONFIG_FROM_STORAGE_COMPLETE:
    "[MSW Control] Config reloaded. Check with 'mswControl.listHandlers()'.",
  RESET_TO_INITIAL_CONFIG:
    "[MSW Control] Resetting to initial code-level configuration...",
  RESET_TO_INITIAL_CONFIG_COMPLETE:
    "[MSW Control] Reset to initial code-level configuration complete:",
  WORKER_IS_RUNNING_STATUS: (p) =>
    `[MSW Control] Worker running status: ${p.status}`,
  HELP_GUIDE_HEADER: "--- MSW Dev Mode Guide ---",
  HELP_GUIDE_INTRO:
    "You can control mock handlers using the 'mswControl' object in the developer console.",
  HELP_GUIDE_EXAMPLES: "Examples:",
  HELP_LIST_HANDLERS:
    "  mswControl.listHandlers()        - List all handlers and their status",
  HELP_ENABLE_HANDLER:
    "  mswControl.enableHandler('ID')   - Enable a handler by its ID",
  HELP_DISABLE_HANDLER:
    "  mswControl.disableHandler('ID')  - Disable a handler by its ID",
  HELP_ENABLE_ALL: "  mswControl.enableAllHandlers()   - Enable all handlers",
  HELP_DISABLE_ALL: "  mswControl.disableAllHandlers()  - Disable all handlers",
  HELP_ENABLE_GROUP:
    "  mswControl.enableGroup('groupID')   - Enable handlers in a specific group",
  HELP_DISABLE_GROUP:
    "  mswControl.disableGroup('groupID')  - Disable handlers in a specific group",
  HELP_GET_CONFIG:
    "  mswControl.getCurrentConfig()    - View current in-memory config",
  HELP_SAVE_CONFIG:
    "  mswControl.saveConfigToLocalStorage() - Save the current config to localStorage",
  HELP_LOAD_CONFIG:
    "  mswControl.loadConfigFromLocalStorage() - Load config from localStorage (Warning: overwrites current changes)",
  HELP_RESET_CONFIG:
    "  mswControl.resetToInitialCodeConfig() - Reset to the initial code-level config",
  HELP_CONFIG_SOURCE_INFO:
    "The initial handler activation state is determined by the `handlerGroups` config at controller initialization.",
  HELP_RUNTIME_CHANGES_INFO:
    "Runtime changes are automatically saved to localStorage to persist across sessions.",
  CONTROLLER_READY_HINT:
    "[MSW Controller] Type 'mswControl.help()' in the console to see available commands.",
  UNKNOWN_GROUP_WARN: (p) => `[MSW Control] Unknown group '${p.groupName}'.`,
};
