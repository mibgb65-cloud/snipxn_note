import { apiClient } from './axios';

export interface SubmitFeedbackRequest {
  content: string;
  contact: string | null;
  images: string[];
}

export interface SubmitFeedbackResponse {
  id: string;
  status: string;
  createdAt: string | null;
  confirmationEmailQueued: boolean;
}

export function submitFeedback(
  payload: SubmitFeedbackRequest,
): Promise<SubmitFeedbackResponse> {
  return apiClient.post<SubmitFeedbackResponse, SubmitFeedbackRequest>(
    '/feedbacks',
    payload,
  );
}
