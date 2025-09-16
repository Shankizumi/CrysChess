package com.shanks.game.boardgame_backend.dao.repository;

import com.shanks.game.boardgame_backend.dto.entity.Friend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {
    List<Friend> findByUserIdAndStatus(Long userId, String status);
    List<Friend> findByFriendIdAndStatus(Long friendId, String status);
    Optional<Friend> findByUserIdAndFriendId(Long userId, Long friendId);
    void deleteByUserIdAndFriendId(Long userId, Long friendId);
    List<Friend> findByUserIdAndStatusContaining(Long userId, String status);
    // ✅ Fetch all accepted friendships where user is either sender or receiver
    @Query("SELECT f FROM Friend f WHERE (f.userId = :userId OR f.friendId = :userId) AND f.status = 'ACCEPTED'")
    List<Friend> findAllFriendsForUser(@Param("userId") Long userId);

}
