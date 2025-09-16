package com.shanks.game.boardgame_backend.dao.service;


import com.shanks.game.boardgame_backend.dao.repository.UserRepository;
import com.shanks.game.boardgame_backend.dto.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // ✅ Register User
    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already in use");
        }
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already taken");
        }
        return userRepository.save(user);
    }

    // ✅ Login User
    public User loginUser(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(password)) { // later hash comparison
                return user;
            }
        }
        throw new RuntimeException("Invalid email or password");
    }

    // ✅ Get All Users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ✅ Get User by ID
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ✅ Update User Stats (wins, losses, rankPoints, etc.)
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    // ✅ Delete User (optional – for dev/admin use)
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }


    public User increaseRank(Long userId, int points) {
        User user = getUserById(userId);
        user.setRankPoints(user.getRankPoints() + points);
        // Optional: recalc rank tiers (Bronze, Silver, etc.)
        return userRepository.save(user);
    }

    // Decrease Rank (on loss)
    public User decreaseRank(Long userId, int points) {
        User user = getUserById(userId);
        int newPoints = user.getRankPoints() - points;
        user.setRankPoints(Math.max(newPoints, 0)); // prevent negative
        return userRepository.save(user);
    }

    // Increase Win Count
    public User increaseWins(Long userId) {
        User user = getUserById(userId);
        user.setWins(user.getWins() + 1);
        user.setGamesPlayed(user.getGamesPlayed() + 1);
        return userRepository.save(user);
    }

    // Increase Loss Count
    public User increaseLosses(Long userId) {
        User user = getUserById(userId);
        user.setLosses(user.getLosses() + 1);
        user.setGamesPlayed(user.getGamesPlayed() + 1);
        return userRepository.save(user);
    }

    public List<User> searchUsers(String username) {
        return userRepository.findByUsernameContainingIgnoreCase(username);
    }

}
