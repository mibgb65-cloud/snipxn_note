export type ConflictResolution = 'use_remote' | 'keep_local';

interface VersionedRecord {
  version?: number | null;
}

export function resolveConflict(
  tableName: string,
  local: VersionedRecord | null | undefined,
  remote: VersionedRecord | null | undefined,
): ConflictResolution {
  void tableName;

  const localVersion = typeof local?.version === 'number' ? local.version : 0;
  const remoteVersion = typeof remote?.version === 'number' ? remote.version : 0;

  if (remoteVersion > localVersion) {
    return 'use_remote';
  }

  return 'keep_local';
}
