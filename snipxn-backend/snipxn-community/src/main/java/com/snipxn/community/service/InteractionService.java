package com.snipxn.community.service;

public interface InteractionService {

    void like(String userId, String postId);

    void unlike(String userId, String postId);

    void collect(String userId, String postId);

    void uncollect(String userId, String postId);
}
