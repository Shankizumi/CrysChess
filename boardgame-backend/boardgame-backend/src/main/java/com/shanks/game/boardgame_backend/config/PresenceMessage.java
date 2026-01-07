package com.shanks.game.boardgame_backend.config;


public class PresenceMessage {
    private Long userId;
    private boolean online;

    public PresenceMessage(Long userId, boolean online) {
        this.userId = userId;
        this.online = online;
    }

    public Long getUserId() {
        return userId;
    }

    public boolean isOnline() {
        return online;
    }
}
