package com.shanks.game.boardgame_backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
public class WebSocketPresenceListener {

    @Autowired
    private OnlineUserTracker tracker;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String userId = accessor.getUser().getName();

        tracker.userOnline(userId);

        messagingTemplate.convertAndSend(
                "/topic/presence",
                tracker.getOnlineUsers()
        );
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = accessor.getUser();

        if (user != null) {
            tracker.userOffline(user.getName());

            messagingTemplate.convertAndSend(
                    "/topic/presence",
                    tracker.getOnlineUsers()
            );
        }
    }
}
