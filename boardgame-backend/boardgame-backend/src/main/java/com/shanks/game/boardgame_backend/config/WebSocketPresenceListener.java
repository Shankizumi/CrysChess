package com.shanks.game.boardgame_backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketPresenceListener {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        if (accessor.getUser() == null) return;

        Long userId = Long.parseLong(accessor.getUser().getName());
        System.out.println(userId);

        messagingTemplate.convertAndSend(
                "/topic/presence",
                new PresenceMessage(userId, true)
        );
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        if (accessor.getUser() == null) return;

        Long userId = Long.parseLong(accessor.getUser().getName());

        messagingTemplate.convertAndSend(
                "/topic/presence",
                new PresenceMessage(userId, false)
        );
    }
}
