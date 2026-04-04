import type { RunCodeRequest, RunCodeResponse } from '../types';

import { apiClient } from './axios';

const SANDBOX_BASE_URL = '/sandbox';

export function runCode(req: RunCodeRequest): Promise<RunCodeResponse> {
  return apiClient.post<RunCodeResponse, RunCodeRequest>(
    `${SANDBOX_BASE_URL}/run`,
    req,
  );
}
