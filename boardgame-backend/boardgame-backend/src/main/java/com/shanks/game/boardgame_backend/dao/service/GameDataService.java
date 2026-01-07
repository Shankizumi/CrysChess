package com.shanks.game.boardgame_backend.dao.service;

import com.shanks.game.boardgame_backend.dto.entity.Game;
import com.shanks.game.boardgame_backend.dto.entity.GameData;
import com.shanks.game.boardgame_backend.dto.entity.User;
import com.shanks.game.boardgame_backend.dao.repository.GameDataRepository;
import com.shanks.game.boardgame_backend.dao.repository.GameRepository;
import com.shanks.game.boardgame_backend.dao.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class GameDataService {

    @Autowired
    private GameDataRepository gameDataRepository;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public GameData ensureGameDataForGame(Long gameId) {
        Optional<GameData> maybe = gameDataRepository.findByGameId(gameId);
        if (maybe.isPresent()) return maybe.get();

        // create default board structure (client expects { board: [...], turn: "red" })
        String defaultJson = createDefaultBoardJson();
        GameData gd = GameData.builder()
                .gameId(gameId)
                .lastPlayerId(null)
                .data(defaultJson)
                .turn("red")
                .build();
        return gameDataRepository.save(gd);
    }

    private String createDefaultBoardJson() {
        // small 8x8 default similar to frontend initial board
        try {
            JsonNode root = objectMapper.createObjectNode();
            ((com.fasterxml.jackson.databind.node.ObjectNode) root).put("turn", "red");
            com.fasterxml.jackson.databind.node.ArrayNode board = objectMapper.createArrayNode();
            for (int r = 0; r < 8; r++) {
                com.fasterxml.jackson.databind.node.ArrayNode row = objectMapper.createArrayNode();
                for (int c = 0; c < 8; c++) {
                    if (r < 2) row.add("red");
                    else if (r >= 6) row.add("blue");
                    else row.addNull();
                }
                board.add(row);
            }
            ((com.fasterxml.jackson.databind.node.ObjectNode) root).set("board", board);
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Process a move coming from socket/controller.
     * payload should include playerId and move board (or minimal move) — we'll accept full board JSON for simplicity.
     */
    public GameData processSocketMove(Long gameId, Long playerId, String boardJson, String nextTurn) {
        Game game = gameRepository.findById(gameId).orElseThrow(() -> new RuntimeException("Game not found"));
        GameData gd = gameDataRepository.findByGameId(gameId).orElse(null);

        if (gd == null) {
            gd = ensureGameDataForGame(gameId);
        }

        // Validate turn: if lastPlayerId equals playerId -> reject
        if (gd.getLastPlayerId() != null && gd.getLastPlayerId().equals(playerId)) {
            throw new RuntimeException("Not your turn");
        }

        // update authoritative data
        gd.setData(boardJson);
        gd.setLastPlayerId(playerId);
        gd.setTurn(nextTurn);

        GameData saved = gameDataRepository.save(gd);

        // Broadcast the updated GameData to subscribers
        messagingTemplate.convertAndSend("/topic/game/" + gameId, saved);

        return saved;
    }

    public GameData getGameData(Long gameId) {
        return gameDataRepository.findByGameId(gameId).orElseGet(() -> ensureGameDataForGame(gameId));
    }
}
