package com.shanks.game.boardgame_backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shanks.game.boardgame_backend.dao.service.GameDataService;
import com.shanks.game.boardgame_backend.dto.entity.Game;
import com.shanks.game.boardgame_backend.dao.service.GameService;
import com.shanks.game.boardgame_backend.dto.entity.GameData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class GameSocketController {

    @Autowired
    private GameService gameService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private GameDataService gameDataService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Player joins a game
     */
    @MessageMapping("/game/{gameId}/join")
    public void joinGame(@DestinationVariable Long gameId, String username) {
        Game game = gameService.playerJoin(gameId, username);
        messagingTemplate.convertAndSend("/topic/game/" + gameId, game);
    }

    /**
     * Handle player moves (sent as a string)
     */
    @MessageMapping("/game/{gameId}/move")
    public void handleMove(@DestinationVariable Long gameId, String payload) {
        try {
            // payload expected: {"playerId":123, "board": {...}, "turn":"blue"}
            JsonNode node = objectMapper.readTree(payload);
            Long playerId = node.has("playerId") ? node.get("playerId").asLong() : null;
            JsonNode boardNode = node.get("board");
            String turn = node.has("turn") ? node.get("turn").asText() : null;
            if (playerId == null || boardNode == null) {
                throw new RuntimeException("Invalid move payload");
            }
            String boardJson = objectMapper.writeValueAsString(boardNode);

            // process and broadcast (service will broadcast)
            GameData updated = gameDataService.processSocketMove(gameId, playerId, boardJson, turn);

            // (Optional) also send to topic if service didn't
            // messagingTemplate.convertAndSend("/topic/game/" + gameId, updated);

        } catch (Exception ex) {
            // log exception; consider sending a user-facing error message
            ex.printStackTrace();
        }
    }



    @MessageMapping("/game/{gameId}/chat")
    public void handleChat(@DestinationVariable String gameId, String messageJson) {
        messagingTemplate.convertAndSend("/topic/game/" + gameId, messageJson);
    }


    /**
     * End the game with a winner username
     */
    @MessageMapping("/game/{gameId}/end")
    public void endGame(@DestinationVariable Long gameId, String winnerUsername) {
        Game endedGame = gameService.endGameSocket(gameId, winnerUsername);
        messagingTemplate.convertAndSend("/topic/game/" + gameId, endedGame);
    }
}
