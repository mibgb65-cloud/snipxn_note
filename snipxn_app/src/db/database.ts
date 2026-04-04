import { open, type DB, type SQLBatchTuple } from '@op-engineering/op-sqlite';

import { SCHEMA_SQL_STATEMENTS } from './schema';

const DATABASE_NAME = 'snipxn.db';

let databaseInstance: DB | null = null;
let initPromise: Promise<DB> | null = null;

function createDatabase(): DB {
  return open({
    name: DATABASE_NAME,
  });
}

function createSchemaBatch(): SQLBatchTuple[] {
  return SCHEMA_SQL_STATEMENTS.map(statement => [statement]);
}

async function applySchema(db: DB): Promise<void> {
  await db.executeBatch(createSchemaBatch());
}

export async function initDatabase(): Promise<DB> {
  if (databaseInstance !== null) {
    return databaseInstance;
  }

  if (initPromise !== null) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = createDatabase();

    try {
      await applySchema(db);
      databaseInstance = db;
      return db;
    } catch (error) {
      try {
        db.close();
      } catch {
        // Ignore close failures after schema setup errors.
      }

      throw error;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export function getDatabase(): DB {
  if (databaseInstance === null) {
    throw new Error('Database has not been initialized. Call initDatabase() first.');
  }

  return databaseInstance;
}

export async function resetDatabase(): Promise<DB> {
  if (initPromise !== null) {
    try {
      await initPromise;
    } catch {
      // Ignore initialization failures and proceed with recreation.
    }
  }

  if (databaseInstance !== null) {
    const db = databaseInstance;
    databaseInstance = null;
    db.delete();
  } else {
    const db = createDatabase();
    db.delete();
  }

  return initDatabase();
}

export { DATABASE_NAME };
