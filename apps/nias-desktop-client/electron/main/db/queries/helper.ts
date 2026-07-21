import type Database from 'better-sqlite3-multiple-ciphers';

/**
 * BaseQueries is an abstract class that provides common database operations for a specific table.
 * It is designed to be extended by specific query classes for different tables.
 */
export abstract class BaseQueries<T, CreateParams, UpdateParams> {
  constructor(
    protected readonly db: Database.Database,
    protected readonly tableName: string,
    protected readonly columns: string,
  ) {}

  listActive(): T[] {
    return this.db
      .prepare(`SELECT ${this.columns} FROM ${this.tableName} WHERE deleted_at IS NULL`)
      .all() as T[];
  }

  listDeleted(): T[] {
    return this.db
      .prepare(`SELECT ${this.columns} FROM ${this.tableName} WHERE deleted_at IS NOT NULL`)
      .all() as T[];
  }

  getById(id: string): T | null {
    return (
      (this.db
        .prepare(`SELECT ${this.columns} FROM ${this.tableName} WHERE id = ?`)
        .get(id) as T) || null
    );
  }

  delete(id: string): void {
    this.db
      .prepare(`UPDATE ${this.tableName} SET deleted_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), id);
  }

  restore(id: string): void {
    this.db.prepare(`UPDATE ${this.tableName} SET deleted_at = NULL WHERE id = ?`).run(id);
  }

  transaction(callback: () => void): void {
    const transaction = this.db.transaction(callback);
    transaction();
  }

  // Abstract methods to be implemented by child classes
  abstract create(params: CreateParams): void;
  abstract update(params: UpdateParams): void;
  abstract upsert(params: T): void;
}