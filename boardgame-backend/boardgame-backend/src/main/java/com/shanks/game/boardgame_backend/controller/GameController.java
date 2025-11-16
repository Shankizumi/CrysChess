package com.shanks.game.boardgame_backend.controller;
import com.shanks.game.boardgame_backend.dto.entity.Game;
import com.shanks.game.boardgame_backend.dto.entity.User;
import com.shanks.game.boardgame_backend.dao.service.GameService;
import com.shanks.game.boardgame_backend.dao.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/games")
public class GameController {

    @Autowired
    private GameService gameService;

    @Autowired
    private UserRepository userRepository;



    @PostMapping("/create")
    public Game createGame(@RequestParam Long player1Id, @RequestParam Long player2Id) {
        User player1 = userRepository.findById(player1Id)
                .orElseThrow(() -> new RuntimeException("Player1 not found"));
        User player2 = userRepository.findById(player2Id)
                .orElseThrow(() -> new RuntimeException("Player2 not found"));
        return gameService.createGame(player1, player2);
    }

    @GetMapping("/user/{userId}")
    public List<Game> getUserGames(@PathVariable Long userId) {
        return gameService.getGamesByUser(userId);
    }

    @PutMapping("/{gameId}/status")
    public Game updateGameStatus(@PathVariable Long gameId, @RequestParam String status) {
        return gameService.updateGameStatus(gameId, status);
    }

    @PutMapping("/{gameId}/end")
    public Game endGame(@PathVariable Long gameId,
                        @RequestParam Long winnerId,
                        @RequestParam Long loserId) {

        User winner = userRepository.findById(winnerId)
                .orElseThrow(() -> new RuntimeException("Winner not found"));
        User loser = userRepository.findById(loserId)
                .orElseThrow(() -> new RuntimeException("Loser not found"));

        return gameService.endGame(gameId, winner, loser);
    }

    @PostMapping("/find-or-create")
    public Game findOrCreateGame(@RequestParam Long userId) {
        User player = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Find any waiting game
        Game waitingGame = gameService.findWaitingGame();
        Game game;

        // ✅ Prevent same user from joining their own game
        if (waitingGame != null && !waitingGame.getPlayer1().getId().equals(userId)) {
            waitingGame.setPlayer2(player);
            waitingGame.setStatus("IN_PROGRESS");
            game = gameService.save(waitingGame);
        } else {
            Game newGame = new Game();
            newGame.setPlayer1(player);
            newGame.setStatus("WAITING");
            game = gameService.save(newGame);
        }

        return game;
    }



}
