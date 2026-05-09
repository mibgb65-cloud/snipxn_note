import api from './axios';
import { getDeviceId } from '../composables/useDeviceId';

export function reviewCode(payload) {
  return api.post('/ai/review', payload, { timeout: 60000 });
}

export function generateCode(payload) {
  return api.post('/ai/generate', payload, { timeout: 60000 });
}

function buildStreamHeaders(token) {
  const headers = {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }

  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken,
      deviceId: getDeviceId(),
    }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || (result?.code !== 200 && result?.code !== 0)) {
    throw new Error(result?.message || 'Refresh failed');
  }

  const tokenData = result.data || {};
  localStorage.setItem('accessToken', tokenData.accessToken);
  localStorage.setItem('refreshToken', tokenData.refreshToken);
  return tokenData.accessToken;
}

function extractStreamError(text, fallback) {
  if (!text) {
    return fallback;
  }

  try {
    const payload = JSON.parse(text);
    return payload?.message || payload?.data?.message || fallback;
  } catch {
    return text.trim() || fallback;
  }
}

async function requestGenerateStream(payload, signal, token) {
  return fetch('/api/v1/ai/generate/stream', {
    method: 'POST',
    headers: buildStreamHeaders(token),
    body: JSON.stringify(payload),
    signal,
  });
}

function parseSseEvent(eventText) {
  const event = { name: 'message', data: '' };
  const dataLines = [];

  for (const rawLine of eventText.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith(':')) {
      continue;
    }

    if (line.startsWith('event:')) {
      event.name = line.slice(6).trim();
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  event.data = dataLines.join('\n');
  return event;
}

function handleStreamEvent(event, onChunk) {
  if (!event.data || event.data === '[DONE]') {
    return event.name === 'done' || event.data === '[DONE]';
  }

  const payload = JSON.parse(event.data);
  if (event.name === 'error') {
    throw new Error(payload?.message || 'AI generation failed');
  }

  if (event.name === 'done') {
    return true;
  }

  if (typeof payload?.content === 'string' && payload.content) {
    onChunk?.(payload.content);
  }

  return false;
}

export async function generateCodeStream(payload, { onChunk, signal } = {}) {
  let token = localStorage.getItem('accessToken');
  let response = await requestGenerateStream(payload, signal, token);

  if (response.status === 401 && localStorage.getItem('refreshToken')) {
    token = await refreshAccessToken();
    response = await requestGenerateStream(payload, signal, token);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(extractStreamError(text, `AI stream failed (${response.status})`));
  }

  if (!response.body) {
    throw new Error('Current browser does not support streaming responses');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || '';

    for (const eventText of events) {
      if (!eventText.trim()) {
        continue;
      }
      streamDone = handleStreamEvent(parseSseEvent(eventText), onChunk);
      if (streamDone) {
        break;
      }
    }
  }

  buffer += decoder.decode();
  if (!streamDone && buffer.trim()) {
    handleStreamEvent(parseSseEvent(buffer), onChunk);
  }
}
