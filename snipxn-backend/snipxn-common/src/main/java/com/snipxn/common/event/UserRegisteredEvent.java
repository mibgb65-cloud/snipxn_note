package com.snipxn.common.event;

public class UserRegisteredEvent {

    private final String userId;

    public UserRegisteredEvent(String userId) {
        this.userId = userId;
    }

    public String getUserId() {
        return userId;
    }
}
