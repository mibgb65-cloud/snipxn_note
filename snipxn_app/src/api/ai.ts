import type {
  AiResponse,
  GenerateRequest,
  GenerateResponse,
  ReviewRequest,
  ReviewResponse,
} from '../types';

import { apiClient } from './axios';

const AI_BASE_URL = '/ai';

interface RawAiResponse {
  content?: string | null;
  model?: string | null;
  totalTokens?: number | null;
}

function normalizeAiResponse(response: RawAiResponse | string | null | undefined): AiResponse {
  if (typeof response === 'string') {
    return {
      content: response,
      model: null,
      totalTokens: null,
    };
  }

  return {
    content: typeof response?.content === 'string' ? response.content : '',
    model: typeof response?.model === 'string' ? response.model : null,
    totalTokens:
      typeof response?.totalTokens === 'number' && Number.isFinite(response.totalTokens)
        ? response.totalTokens
        : null,
  };
}

export async function review(req: ReviewRequest): Promise<ReviewResponse> {
  const response = await apiClient.post<RawAiResponse | string, ReviewRequest>(
    `${AI_BASE_URL}/review`,
    req,
  );

  return normalizeAiResponse(response);
}

export async function generate(req: GenerateRequest): Promise<GenerateResponse> {
  const response = await apiClient.post<RawAiResponse | string, GenerateRequest>(
    `${AI_BASE_URL}/generate`,
    req,
  );

  return normalizeAiResponse(response);
}
