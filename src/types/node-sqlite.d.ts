declare module "node:sqlite" {
  export interface SqliteOptions {
    [key: string]: unknown;
  }
  export class StatementSync {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
    // ponytail: rows typed as any to keep service-layer row casts simple;
    // tighten to inferred row types if @types/node ships node:sqlite later.
    all(...params: unknown[]): any;
    get(...params: unknown[]): any;
  }
  export class DatabaseSync {
    constructor(location: string, options?: SqliteOptions);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
  export const constants: Record<string, unknown>;
  export class Session {
    constructor();
  }
  export function backup(): void;
}
