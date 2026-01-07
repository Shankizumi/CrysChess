package com.shanks.game.boardgame_backend.config;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OnlineUserTracker {

    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    public void userOnline(String userId) {
        onlineUsers.add(userId);
    }

    public void userOffline(String userId) {
        onlineUsers.remove(userId);
    }

    public Set<String> getOnlineUsers() {
        return onlineUsers;
    }
}
