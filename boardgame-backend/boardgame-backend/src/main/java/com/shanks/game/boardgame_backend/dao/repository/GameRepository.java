package com.shanks.game.boardgame_backend.dao.repository;


import com.shanks.game.boardgame_backend.dto.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findByPlayer1IdOrPlayer2Id(Long player1Id, Long player2Id);
    Game findFirstByStatus(String status);

}
