import type { PendingDelete } from '../../types';
import { getDatabase } from '../database';

import { getRows, mapPendingDeleteRow } from './internal';

export async function getAll(): Promise<PendingDelete[]> {
  const rows = await getRows<any>(
    getDatabase(),
    `
    SELECT *
    FROM pending_deletes
    ORDER BY created_at ASC
    `,
  );

  return rows.map(mapPendingDeleteRow);
}

export async function insert(item: PendingDelete): Promise<void> {
  await getDatabase().transaction(async tx => {
    await tx.execute(
      'DELETE FROM pending_deletes WHERE table_name = ? AND record_id = ?',
      [item.tableName, item.recordId],
    );
    await tx.execute(
      `
      INSERT INTO pending_deletes (id, table_name, record_id, version, created_at)
      VALUES (?, ?, ?, ?, ?)
      `,
      [item.id, item.tableName, item.recordId, item.version, item.createdAt],
    );
  });
}

export async function clearAll(): Promise<void> {
  await getDatabase().execute('DELETE FROM pending_deletes');
}
