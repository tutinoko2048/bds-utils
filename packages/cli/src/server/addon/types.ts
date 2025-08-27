type Brand<T, B> = T & { __brand: B };

export type Version = string | [number, number, number];

export type Uuid = Brand<string, 'uuid'>;

export type ModuleType =
  | 'resources'
  | 'data'
  | 'client_data'
  | 'interface'
  | 'world_template'
  | 'javascript'
  | 'script';

export interface Manifest {
  format_version: number;
  header: {
    name: string;
    description: string;
    uuid: Uuid;
    version: Version;
  };
  modules: {
    version: Version;
    type: ModuleType;
    uuid: Uuid;
    description?: string;
    language?: string;
    entry?: string;
  }[];
  dependencies: {
    module_name?: string;
    uuid?: Uuid;
    version: Version;
  }[];
}

export interface PackStack {
  pack_id: Uuid;
  version: Version;
}

export type AddonType = 'behavior' | 'resource';
