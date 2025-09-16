package com.shanks.game.boardgame_backend.controller;

import com.shanks.game.boardgame_backend.dao.service.FriendService;
import com.shanks.game.boardgame_backend.dto.entity.Friend;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    @Autowired
    private FriendService friendService;

    // ✅ Send Friend Request
    @PostMapping("/send")
    public Friend sendRequest(@RequestParam Long userId, @RequestParam Long friendId) {
        return friendService.sendRequest(userId, friendId);
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
    public String removeFriend(@RequestParam Long userId, @RequestParam Long friendId) {
        friendService.removeFriend(userId, friendId);
        return "Friend removed successfully";
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
