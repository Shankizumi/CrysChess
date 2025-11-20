package com.shanks.game.boardgame_backend.controller;

import com.shanks.game.boardgame_backend.dto.entity.Game;
import com.shanks.game.boardgame_backend.dao.service.GameService;
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
    public void handleMove(@DestinationVariable Long gameId, String move) {
        Game updatedGame = gameService.processMove(gameId, move);
        messagingTemplate.convertAndSend("/topic/game/" + gameId, updatedGame);
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
