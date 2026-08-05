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
    protected readonly tableOrder: string,
    protected readonly hasSoftDelete: boolean = true
  ) {}

  listActive(): T[] {
    const whereClause = this.hasSoftDelete ? 'WHERE deleted_at IS NULL' : '';

    return this.db
      .prepare(`
        SELECT
          ${this.columns}
        FROM
          ${this.tableName}
        ${whereClause}
        ORDER BY
          ${this.tableOrder}
      `)
      .all() as T[];
  }

  listDeleted(): T[] {
    const whereClause = this.hasSoftDelete ? 'WHERE deleted_at IS NOT NULL' : '';

    return this.db
      .prepare(`
        SELECT
          ${this.columns}
        FROM
          ${this.tableName}
        ${whereClause}
        ORDER BY
          ${this.tableOrder}
      `)
      .all() as T[];
  }

  listDirty(): T[] {
    return this.db
      .prepare(`
        SELECT
          ${this.columns}
        FROM
          ${this.tableName}
        WHERE
          is_synced = 0
        ORDER BY
          ${this.tableOrder}
      `)
      .all() as T[];
  }

  getById(id: string): T | null {
    return (
      (this.db
        .prepare(`
          SELECT
            ${this.columns}
          FROM
            ${this.tableName}
          WHERE
            id = ?
        `)
        .get(id) as T) || null
    );
  }

  delete(id: string): void {
    this.db
      .prepare(`
        UPDATE ${this.tableName}
        SET
          is_synced = 0,
          deleted_at = ?
        WHERE
          id = ?
      `)
      .run(new Date().toISOString(), id);
  }

  restore(id: string): void {
    this.db
      .prepare(`
        UPDATE ${this.tableName}
        SET
          is_synced = 0,
          deleted_at = NULL
        WHERE
          id = ?
      `)
      .run(id);
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
