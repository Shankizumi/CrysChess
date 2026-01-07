package com.shanks.game.boardgame_backend.dao.repository;

import com.shanks.game.boardgame_backend.dto.entity.GameData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GameDataRepository extends JpaRepository<GameData, Long> {
    Optional<GameData> findByGameId(Long gameId);
}
