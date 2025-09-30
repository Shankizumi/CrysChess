package com.shanks.game.boardgame_backend.dao.service;

import com.shanks.game.boardgame_backend.dao.repository.FriendRepository;
import com.shanks.game.boardgame_backend.dto.entity.Friend;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FriendService {

    @Autowired
    private FriendRepository friendRepository;

    // ✅ Send Friend Request
    public Friend sendRequest(Long userId, Long friendId) {
        Optional<Friend> existing = friendRepository.findByUserIdAndFriendId(userId, friendId);
        Optional<Friend> reverse = friendRepository.findByUserIdAndFriendId(friendId, userId);
        if (existing.isPresent() || reverse.isPresent()) {
            throw new RuntimeException("Friend request already exists or you are already friends");
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
        friendRepository.save(request);

        // Insert reverse friendship if not exists (for bidirectional relation)
        if (!friendRepository.findByUserIdAndFriendId(request.getFriendId(), request.getUserId()).isPresent()) {
            Friend reverse = Friend.builder()
                    .userId(request.getFriendId())
                    .friendId(request.getUserId())
                    .status("ACCEPTED")
                    .build();
            friendRepository.save(reverse);
        }

        return request;
    }

    // ✅ Reject Friend Request
// ✅ Reject Friend Request
    public Friend rejectRequest(Long requestId) {
        Friend request = friendRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus("REJECTED");
        return friendRepository.save(request); // return the updated Friend
    }


    // ✅ View All Friends of a User (both directions)
    public List<Friend> getFriends(Long userId) {
        return friendRepository.findAllFriendsForUser(userId);
    }

    // ✅ View Pending Requests (for a user)
    public List<Friend> getPendingRequests(Long userId) {
        List<Friend> incoming = friendRepository.findByFriendIdAndStatus(userId, "PENDING");
        List<Friend> outgoing = friendRepository.findByUserIdAndStatus(userId, "PENDING");

        List<Friend> all = new ArrayList<>();
        all.addAll(incoming);
        all.addAll(outgoing);
        return all;
    }

    // ✅ Remove Friend (both directions)
    public void removeFriend(Long userId, Long friendId) {
        friendRepository.deleteFriendship(userId, friendId);
    }

    // ✅ Check Friendship Status (now both directions)
    public String checkFriendshipStatus(Long userId, Long friendId) {
        return friendRepository.findByUserIdAndFriendId(userId, friendId)
                .map(Friend::getStatus)
                .orElseGet(() -> friendRepository.findByUserIdAndFriendId(friendId, userId)
                        .map(Friend::getStatus)
                        .orElse("NOT_FRIENDS"));
    }

    // ✅ Search Friends by Username or Email
    public List<Friend> searchFriends(Long userId, String query) {
        return friendRepository.findByUserIdAndStatusContaining(userId, query);
    }
}
