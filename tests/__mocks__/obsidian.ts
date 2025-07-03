export class Plugin {
  app = {};
  settings = {};
  addSettingTab = jest.fn();
  registerEvent = jest.fn();
  loadData = jest.fn();
  saveData = jest.fn();
}

export class Notice {
  constructor(message: string) {}
}

export class TFile {
  constructor(public path: string, public name: string, public basename: string, public extension: string) {}
}

export class PluginSettingTab {
  constructor(public app: any, public plugin: any) {}
}

export class Setting {
  constructor(public containerEl: any) {}
  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  addText = jest.fn().mockReturnThis();
  addButton = jest.fn().mockReturnThis();
  onClick = jest.fn().mockReturnThis();
  onChange = jest.fn().mockReturnThis();
  setValue = jest.fn().mockReturnThis();
  setPlaceholder = jest.fn().mockReturnThis();
  setButtonText = jest.fn().mockReturnThis();
  setCta = jest.fn().mockReturnThis();
}

export interface MetadataCache {
  getFileCache: jest.Mock;
  on: jest.Mock;
}

export interface Vault {
  getMarkdownFiles: jest.Mock;
  getAbstractFileByPath: jest.Mock;
  read: jest.Mock;
  modify: jest.Mock;
}

export interface App {
  vault: Vault;
  metadataCache: MetadataCache;
}