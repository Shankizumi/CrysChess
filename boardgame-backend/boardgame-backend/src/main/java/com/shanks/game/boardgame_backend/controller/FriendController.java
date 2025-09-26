package com.shanks.game.boardgame_backend.controller;

import com.shanks.game.boardgame_backend.dao.service.FriendService;
import com.shanks.game.boardgame_backend.dto.entity.Friend;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    @Autowired
    private FriendService friendService;
    private static final Logger logger = LoggerFactory.getLogger(FriendController.class);


    // ✅ Send Friend Request
    @PostMapping("/send")
    public ResponseEntity<?> sendRequest(@RequestParam Long userId, @RequestParam Long friendId) {
        try {
            logger.info("Sending friend request from {} to {}", userId, friendId);
            Friend friendRequest = friendService.sendRequest(userId, friendId);
            logger.info("Friend request created with id {}", friendRequest.getId());
            return ResponseEntity.ok(friendRequest);
        } catch (RuntimeException ex) {
            logger.warn("Friend request conflict: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
        } catch (Exception ex) {
            logger.error("Error sending friend request", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }


    // ✅ Accept Friend Request
    @PutMapping("/accept/{requestId}")
    public Friend acceptRequest(@PathVariable Long requestId) {
        return friendService.acceptRequest(requestId);
    }

    // ✅ Reject Friend Request
    @PutMapping("/reject/{requestId}")
    public Friend rejectRequest(@PathVariable Long requestId) {
        return friendService.rejectRequest(requestId);
    }
    // ✅ Get Friend List
    @GetMapping("/{userId}/list")
    public List<Friend> getFriends(@PathVariable Long userId) {
        return friendService.getFriends(userId);
    }

    // ✅ Get Pending Requests
    @GetMapping("/{userId}/pending")
    public List<Friend> getPendingRequests(@PathVariable Long userId) {
        return friendService.getPendingRequests(userId);
    }

    // ✅ Remove Friend
    @DeleteMapping("/remove")
    public ResponseEntity<?> removeFriend(@RequestParam Long userId, @RequestParam Long friendId) {
        friendService.removeFriend(userId, friendId);
        return ResponseEntity.ok("Friend removed successfully");
    }

    // ✅ Check Friendship Status
    @GetMapping("/status")
    public String checkStatus(@RequestParam Long userId, @RequestParam Long friendId) {
        return friendService.checkFriendshipStatus(userId, friendId);
    }

    // ✅ Search Friends (by username or email)
    @GetMapping("/search")
    public List<Friend> searchFriends(@RequestParam Long userId, @RequestParam String query) {
        return friendService.searchFriends(userId, query);
    }
}
