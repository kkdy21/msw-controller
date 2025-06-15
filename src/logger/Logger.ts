// src/logger/Logger.ts
import {
  MESSAGES_KO,
  MESSAGES_EN,
  type Messages,
  type MessageKey,
} from "./messages";

export type LogLevel = "ko" | "en" | "silent";

export class Logger {
  private level: LogLevel;
  private messages: Messages;

  constructor(level: LogLevel = "ko") {
    this.level = level;
    this.messages = level === "en" ? MESSAGES_EN : MESSAGES_KO;
  }

  private print(
    type: "log" | "warn" | "error",
    key: MessageKey,
    params?: Record<string, any>,
    ...optionalParams: any[]
  ) {
    if (this.level === "silent") {
      return;
    }

    let messageTemplate = this.messages[key];
    if (!messageTemplate) {
      console.error(`[Logger] Message key not found: ${String(key)}`);
      return;
    }

    let message: string;
    if (typeof messageTemplate === "function") {
      message = messageTemplate(params || {});
    } else {
      message = messageTemplate;
    }

    console[type](message, ...optionalParams);
  }

  public log(
    key: MessageKey,
    params?: Record<string, any>,
    ...optionalParams: any[]
  ) {
    this.print("log", key, params, ...optionalParams);
  }

  public warn(
    key: MessageKey,
    params?: Record<string, any>,
    ...optionalParams: any[]
  ) {
    this.print("warn", key, params, ...optionalParams);
  }

  public error(
    key: MessageKey,
    params?: Record<string, any>,
    ...optionalParams: any[]
  ) {
    this.print("error", key, params, ...optionalParams);
  }

  /**
   * 테이블, 그룹 등 복잡한 출력을 위해 console 객체를 직접 사용합니다.
   * 'silent' 모드에서는 아무것도 출력하지 않습니다.
   */
  public raw(
    type: "log" | "warn" | "error" | "table" | "group" | "groupEnd",
    ...args: any[]
  ) {
    if (this.level === "silent") {
      return;
    }
    const consoleMethod = console[type as keyof typeof console] as Function;
    if (consoleMethod) {
      consoleMethod(...args);
    }
  }

  public isSilent(): boolean {
    return this.level === "silent";
  }
}
