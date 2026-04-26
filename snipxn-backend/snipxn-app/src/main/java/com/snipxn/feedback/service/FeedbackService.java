package com.snipxn.feedback.service;

import com.snipxn.feedback.dto.req.CreateFeedbackRequest;
import com.snipxn.feedback.dto.resp.FeedbackResponse;

public interface FeedbackService {

    FeedbackResponse createFeedback(String userId, CreateFeedbackRequest request);
}
