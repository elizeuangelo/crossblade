import { ModuleData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/packages.mjs';
import { migratePlaylistSoundData, migrateCompendium, migrateWorld } from './migrations';

export interface CrossbladeModule extends Game.ModuleData<ModuleData> {
  migrations: {
    migrateWorld: typeof migrateWorld;
    migrateCompendium: typeof migrateCompendium;
    migratePlaylistSoundData: typeof migratePlaylistSoundData;
  };
}

export interface PlaylistUpdateData {
  playing?: boolean;
  sounds?: PlaylistSoundUpdateData[];
}

export interface PlaylistSoundUpdateData {
  _id: string;
  playing?: boolean;
  pausedTime?: number;
}

export abstract class CrossbladePlaylistSound extends PlaylistSound {
  cbSoundLayers?: Map<Sound, string[]>;
  protected _cbSoundLayers?: Map<Sound, string[]>;
}

export interface SoundLayer {
  src?: string;
  events?: string[][];
}

//////////////
// Dev Mode //
//////////////

export enum LogLevel {
  NONE = 0,
  INFO = 1,
  ERROR = 2,
  DEBUG = 3,
  WARN = 4,
  ALL = 5,
}
export interface DevModeApi {
  registerPackageDebugFlag(
    packageName: string,
    kind?: 'boolean' | 'level',
    options?: {
      default?: boolean | LogLevel;
      choiceLabelOverrides?: Record<string, string>; // actually keyed by LogLevel number
    },
  ): Promise<boolean>;

  getPackageDebugValue(packageName: string, kind?: 'boolean' | 'level'): boolean | LogLevel;
}

export interface DevModeModuleData extends Game.ModuleData<ModuleData> {
  api?: DevModeApi;
}

export interface CrossbladeEvent {
  key: CrossbladeEventKey;
  label: string;
  description: string;
  options?: Record<string, string>;
  isCustom?: boolean;
}

export type CrossbladeEventKey = 'DEFAULT' | 'COMBATANT' | /* 'COMBATANT_TAG' | */ 'GAME' | 'CUSTOM';

export interface CrossbladeSoundLayer extends Record<string, string | string[]> {
  src: string;
  events: string[];
}

export interface CrossbladeFlags {
  crossblade?: {
    soundLayers?: CrossbladeSoundLayer[];
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SocketHandler<T> = ((...args: any[]) => T) | string;

export interface Socket {
  register<T>(name: string, handler: SocketHandler<T>): void;
  executeAsGM<T>(handler: SocketHandler<T>, ...parameters: unknown[]): Promise<T>;
  executeAsUser<T>(handler: SocketHandler<T>, userId: string, ...parameters: unknown[]): Promise<T>;
  executeForAllGMs<T>(handler: SocketHandler<T>, ...parameters: unknown[]): Promise<T>;
  executeForOtherGMs<T>(handler: SocketHandler<T>, ...parameters: unknown[]): Promise<T>;
  executeForEveryone<T>(handler: SocketHandler<T>, ...parameters: unknown[]): Promise<T>;
  executeForOthers<T>(handler: SocketHandler<T>, ...parameters: unknown[]): Promise<T>;
  executeForUsers<T>(handler: SocketHandler<T>, userIds: string[], ...parameters: unknown[]): Promise<T>;
}

export interface SocketLib {
  registerModule(moduleId: string): Socket;
}

declare global {
  let socketlib: SocketLib;
}
