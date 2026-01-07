package com.shanks.game.boardgame_backend.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import java.security.Principal;
import java.util.Map;

public class UserHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request,
                                      WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {

        // Extract userId from query param
        String query = request.getURI().getQuery(); // e.g., "userId=12"
        Long userId = null;

        if (query != null && query.startsWith("userId=")) {
            try {
                userId = Long.parseLong(query.substring(7));
            } catch (Exception ignored) {}
        }

        if (userId == null) {
            userId = -1L; // fallback
        }

        Long finalId = userId;

        return () -> finalId.toString();
    }
}
