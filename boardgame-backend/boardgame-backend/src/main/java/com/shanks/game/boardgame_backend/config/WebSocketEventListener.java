package com.shanks.game.boardgame_backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener{

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        try {
            // getName() returns String, convert to Long
            Long userId = Long.parseLong(event.getUser().getName());

            String payload = String.format("{\"type\":\"STATUS\", \"userId\":%d, \"online\":true}", userId);
            simpMessagingTemplate.convertAndSend("/topic/friend-status", payload);
        } catch (NumberFormatException e) {
            // handle invalid userId
            e.printStackTrace();
        }
    }


    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        try {
            Long userId = Long.parseLong(event.getUser().getName());

            String payload = String.format("{\"type\":\"STATUS\", \"userId\":%d, \"online\":false}", userId);
            simpMessagingTemplate.convertAndSend("/topic/friend-status", payload);
        } catch (NumberFormatException e) {
            e.printStackTrace();
        }
    }


}

