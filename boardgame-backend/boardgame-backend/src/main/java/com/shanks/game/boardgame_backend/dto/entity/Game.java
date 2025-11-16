package com.shanks.game.boardgame_backend.dto.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "player1_id", nullable = false)
    private User player1;

    @ManyToOne
    @JoinColumn(name = "player2_id", nullable = true)
    private User player2;

    @ManyToOne
    @JoinColumn(name = "winner_id")
    private User winner;

    private String boardState; // JSON / custom chess notation

    private String status; // WAITING, IN_PROGRESS, FINISHED
}
