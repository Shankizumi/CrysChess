package com.shanks.game.boardgame_backend.dto.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "game_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // reference to Game
    @Column(name = "game_id", nullable = false, unique = true)
    private Long gameId;

    // id of player who last played
    @Column(name = "last_player_id")
    private Long lastPlayerId;

    // canonical board JSON (stringified)
    @Lob
    @Column(name = "data", columnDefinition = "TEXT")
    private String data;

    // which color's turn it is (red/blue)
    @Column(name = "turn")
    private String turn;
}
