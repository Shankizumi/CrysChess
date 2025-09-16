package com.shanks.game.boardgame_backend.controller;


import com.shanks.game.boardgame_backend.dao.service.UserService;
import com.shanks.game.boardgame_backend.dto.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // ✅ Register User
    @PostMapping("/register")
    public User registerUser(@RequestBody User user) {
        return userService.registerUser(user);
    }

    // ✅ Login User
    @PostMapping("/login")
    public User loginUser(@RequestParam String email, @RequestParam String password) {
        return userService.loginUser(email, password);
    }

    // ✅ Get All Users
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // ✅ Get User by ID
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // ✅ Increase Rank
    @PutMapping("/{id}/increase-rank")
    public User increaseRank(@PathVariable Long id, @RequestParam int points) {
        return userService.increaseRank(id, points);
    }

    // ✅ Decrease Rank
    @PutMapping("/{id}/decrease-rank")
    public User decreaseRank(@PathVariable Long id, @RequestParam int points) {
        return userService.decreaseRank(id, points);
    }

    // ✅ Increase Wins
    @PutMapping("/{id}/increase-win")
    public User increaseWins(@PathVariable Long id) {
        return userService.increaseWins(id);
    }

    // ✅ Increase Losses
    @PutMapping("/{id}/increase-loss")
    public User increaseLosses(@PathVariable Long id) {
        return userService.increaseLosses(id);
    }

    // ✅ Delete User
    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "User deleted successfully";
    }

    @GetMapping("/search")
    public List<User> searchUsers(@RequestParam String username) {
        return userService.searchUsers(username);
    }

}
