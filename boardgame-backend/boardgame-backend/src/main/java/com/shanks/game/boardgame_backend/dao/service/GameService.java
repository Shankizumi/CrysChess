package com.shanks.game.boardgame_backend.dao.service;

import com.shanks.game.boardgame_backend.dto.entity.Game;
import com.shanks.game.boardgame_backend.dto.entity.User;
import com.shanks.game.boardgame_backend.dao.repository.GameRepository;
import com.shanks.game.boardgame_backend.dao.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GameService {

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private UserRepository userRepository;

    public Game createGame(User player1, User player2) {
        Game game = Game.builder()
                .player1(player1)
                .player2(player2)
                .status("WAITING")
                .boardState("{}")
                .build();
        return gameRepository.save(game);
    }

    public List<Game> getGamesByUser(Long userId) {
        return gameRepository.findByPlayer1IdOrPlayer2Id(userId, userId);
    }

    public Game updateGameStatus(Long gameId, String status) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));
        game.setStatus(status);
        return gameRepository.save(game);
    }

    public Game endGame(Long gameId, User winner, User loser) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        // update game result
        game.setWinner(winner);
        game.setStatus("FINISHED");
        gameRepository.save(game);

        // update winner stats
        winner.setWins(winner.getWins() + 1);
        winner.setGamesPlayed(winner.getGamesPlayed() + 1);
        winner.setRankPoints(winner.getRankPoints() + 3);
        userRepository.save(winner);

        // update loser stats
        loser.setLosses(loser.getLosses() + 1);
        loser.setGamesPlayed(loser.getGamesPlayed() + 1);
        loser.setRankPoints(Math.max(0, loser.getRankPoints() - 1)); // no negatives
        userRepository.save(loser);

        // recalc ranks
        recalculateRanks();

        return game;
    }

    private void recalculateRanks() {
        List<User> allUsers = userRepository.findAllByOrderByRankPointsDesc();
        int rank = 1;
        for (User u : allUsers) {
            u.setCurrentRank(rank++);
            userRepository.save(u);
        }
    }

    public Game playerJoin(Long gameId, String username) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        // If player 2 slot empty, add player
        if (game.getPlayer2() == null) {
            User player2 = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            game.setPlayer2(player2);
            game.setStatus("IN_PROGRESS");
        }

        return gameRepository.save(game);    }

    public Game processMove(Long gameId, String moveJson) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        // Parse moveJson (you can send object: { row, col, color } )
        // and update boardState
        game.setBoardState(moveJson);

        return gameRepository.save(game);    }

    public Game endGameSocket(Long gameId, String winnerUsername) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        User winner = userRepository.findByUsername(winnerUsername)
                .orElseThrow(() -> new RuntimeException("Winner not found"));
        User loser = (winner.getId().equals(game.getPlayer1().getId()))
                ? game.getPlayer2()
                : game.getPlayer1();

        return endGame(gameId, winner, loser);    }

    public Game findWaitingGame() {
        return gameRepository.findFirstByStatus("WAITING");
    }

    public Game save(Game game) {
        return gameRepository.save(game);
    }

}


