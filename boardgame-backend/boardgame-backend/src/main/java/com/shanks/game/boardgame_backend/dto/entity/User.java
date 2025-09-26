package com.shanks.game.boardgame_backend.dto.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // store hashed later, but string for now

    @Column(nullable = false)
    private int rankPoints = 0;

    @Column(nullable = false)
    private int currentRank = 0; // could map ranks (like Bronze, Silver) in logic later

    @Column(nullable = false)
    private int gamesPlayed = 0;

    @Column(nullable = false)
    private int wins = 0;

    @Column(nullable = false)
    private int losses = 0;

    private String profilePictureUrl;

}
