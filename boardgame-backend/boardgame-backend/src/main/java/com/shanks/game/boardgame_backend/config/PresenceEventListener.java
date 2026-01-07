package com.shanks.game.boardgame_backend.config;


import com.shanks.game.boardgame_backend.config.PresenceMessage;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class PresenceEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    public PresenceEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        String userId = event.getUser().getName(); // from UserHandshakeHandler
        if (!userId.equals("-1")) {
            messagingTemplate.convertAndSend(
                    "/topic/presence",
                    new PresenceMessage(Long.parseLong(userId), true)
            );
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        if (event.getUser() == null) return;

        String userId = event.getUser().getName();
        if (!userId.equals("-1")) {
            messagingTemplate.convertAndSend(
                    "/topic/presence",
                    new PresenceMessage(Long.parseLong(userId), false)
            );
        }
    }
}
