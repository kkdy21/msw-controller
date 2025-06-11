import type { RequestHandler } from "msw";
export interface MockHandlerItem {
  id: string;
  description: string;
  handler: RequestHandler;
}

export interface MockHandlerGroup {
  id: string;
  groupName: string;
  description: string;
  handlers: Record<string, MockHandlerItem>;
}

export interface MockHandlerInfo {
  groupName: string;
  id: string;
  description: string;
  enabled: boolean;
}
