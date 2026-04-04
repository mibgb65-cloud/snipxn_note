import DocumentPicker, { type DocumentPickerResponse } from 'react-native-document-picker';

import { noteApi } from '../api';
import type { ImportNotesResponse } from '../types';

const NOTE_IMPORT_TYPES = [
  DocumentPicker.types.json,
  DocumentPicker.types.plainText,
  'text/markdown',
  'text/x-markdown',
  '.md',
  '.markdown',
  '.json',
];

function inferMimeType(document: DocumentPickerResponse): string {
  if (document.type && document.type.trim().length > 0) {
    return document.type;
  }

  const normalizedName = document.name?.trim().toLocaleLowerCase() ?? '';

  if (normalizedName.endsWith('.json')) {
    return 'application/json';
  }

  if (normalizedName.endsWith('.md') || normalizedName.endsWith('.markdown')) {
    return 'text/markdown';
  }

  return 'text/plain';
}

function resolveFileName(document: DocumentPickerResponse): string {
  if (document.name && document.name.trim().length > 0) {
    return document.name.trim();
  }

  return `notes-import-${Date.now()}.md`;
}

export function buildImportNotesFormData(document: DocumentPickerResponse): FormData {
  const fileUri = document.fileCopyUri ?? document.uri;

  if (!fileUri) {
    throw new Error('未读取到导入文件，请重新选择。');
  }

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: inferMimeType(document),
    name: resolveFileName(document),
  } as any);

  return formData;
}

export async function pickAndImportNotes(): Promise<ImportNotesResponse | null> {
  try {
    const document = await DocumentPicker.pickSingle({
      type: NOTE_IMPORT_TYPES,
      copyTo: 'cachesDirectory',
    });

    return await noteApi.importNotes(buildImportNotesFormData(document));
  } catch (error) {
    if (DocumentPicker.isCancel(error)) {
      return null;
    }

    throw error;
  }
}

function findImportedCount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidates = value as Record<string, unknown>;
  const keys = ['importedCount', 'successCount', 'count', 'total', 'imported'];

  for (const key of keys) {
    const candidate = candidates[key];

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  for (const nested of Object.values(candidates)) {
    const count = findImportedCount(nested);

    if (count !== null) {
      return count;
    }
  }

  return null;
}

export function describeImportNotesResult(result: ImportNotesResponse): string {
  const importedCount = findImportedCount(result);

  if (importedCount !== null) {
    return `已导入 ${importedCount} 条笔记，正在同步本地数据。`;
  }

  return '导入请求已提交，正在同步本地数据。';
}
