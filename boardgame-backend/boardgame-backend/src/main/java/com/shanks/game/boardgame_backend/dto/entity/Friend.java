package com.shanks.game.boardgame_backend.dto.entity;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "friends")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Friend {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // who sent the request
    @Column(nullable = false)
    private Long userId;

    // who received the request
    @Column(nullable = false)
    private Long friendId;

    @Column(nullable = false)
    private String status; // PENDING, ACCEPTED, REJECTED
}
