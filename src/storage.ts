export const STORAGE_KEYS = {
  MSW_HANDLER_CONFIG: "msw_handler_config",
} as const;

type StorageKeyType = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export class StorageConnector {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  setItem<T>(key: StorageKeyType, value: T) {
    if (value !== null && value !== undefined) {
      const saveValue = JSON.stringify(value);
      this.storage.setItem(key, saveValue);
    }
  }

  getItem<T>(key: StorageKeyType): T | null {
    const value = this.storage.getItem(key);
    if (value != null) {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error("Error parsing JSON", e);
        return null;
      }
    }
    return null;
  }

  removeItem(key: StorageKeyType) {
    this.storage.removeItem(key);
  }

  clear() {
    this.storage.clear();
  }
}

export const localStorageAccessor = new StorageConnector(window.localStorage);
export const sessionStorageAccessor = new StorageConnector(
  window.sessionStorage
);
