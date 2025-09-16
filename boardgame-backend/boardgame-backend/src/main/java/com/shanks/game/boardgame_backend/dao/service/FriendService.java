package com.shanks.game.boardgame_backend.dao.service;

import com.shanks.game.boardgame_backend.dao.repository.FriendRepository;
import com.shanks.game.boardgame_backend.dto.entity.Friend;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FriendService {

    @Autowired
    private FriendRepository friendRepository;

    // ✅ Send Friend Request
    public Friend sendRequest(Long userId, Long friendId) {
        if (friendRepository.findByUserIdAndFriendId(userId, friendId).isPresent()) {
            throw new RuntimeException("Friend request already exists");
        }

        Friend request = Friend.builder()
                .userId(userId)
                .friendId(friendId)
                .status("PENDING")
                .build();

        return friendRepository.save(request);
    }

    // ✅ Accept Friend Request
    public Friend acceptRequest(Long requestId) {
        Friend request = friendRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus("ACCEPTED");
        return friendRepository.save(request);
    }

    // ✅ Reject Friend Request
    public Friend rejectRequest(Long requestId) {
        Friend request = friendRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus("REJECTED");
        return friendRepository.save(request);
    }

    // ✅ View All Friends of a User
// ✅ View All Friends of a User (both directions)
    public List<Friend> getFriends(Long userId) {
        return friendRepository.findAllFriendsForUser(userId);
    }


    // ✅ View Pending Requests (for a user)
    public List<Friend> getPendingRequests(Long userId) {
        return friendRepository.findByFriendIdAndStatus(userId, "PENDING");
    }

    // ✅ Remove Friend (both directions)
    public void removeFriend(Long userId, Long friendId) {
        friendRepository.deleteByUserIdAndFriendId(userId, friendId);
        friendRepository.deleteByUserIdAndFriendId(friendId, userId);
    }

    // ✅ Check Friendship Status
    public String checkFriendshipStatus(Long userId, Long friendId) {
        return friendRepository.findByUserIdAndFriendId(userId, friendId)
                .map(Friend::getStatus)
                .orElse("NOT_FRIENDS");
    }

    // ✅ Search Friends by Username or Email
    public List<Friend> searchFriends(Long userId, String query) {
        return friendRepository.findByUserIdAndStatusContaining(userId, query);
    }
}
