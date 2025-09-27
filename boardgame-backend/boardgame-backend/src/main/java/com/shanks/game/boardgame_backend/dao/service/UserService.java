package com.shanks.game.boardgame_backend.dao.service;


import com.shanks.game.boardgame_backend.dao.repository.UserRepository;
import com.shanks.game.boardgame_backend.dto.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    private static final String DEFAULT_PFP = "/images/default-avatar.png"; // ✅ default avatar
    private BCryptPasswordEncoder passwordEncoder; // now Spring injects it

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;  // ✅ injected once, usable anywhere in classyyy


    // ✅ Register User
    public User registerUser(User user) {

        // set default profile picture if none provided
        if (user.getProfilePictureUrl() == null || user.getProfilePictureUrl().isBlank()) {
            user.setProfilePictureUrl(DEFAULT_PFP);
        }

        // check email uniqueness
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        // check username uniqueness
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }

        // encode password before saving (security best practice)
        user.setPassword(new BCryptPasswordEncoder().encode(user.getPassword()));

        return userRepository.save(user);
    }


    // ✅ Login User

    public User loginUser(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(); // ✅ no null
            if (encoder.matches(password, user.getPassword())) {
                return user;
            }
        }

        throw new RuntimeException("Invalid email or password");
    }


    // ✅ Get All Users
    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> {
            if (u.getProfilePictureUrl() == null || u.getProfilePictureUrl().isBlank()) {
                u.setProfilePictureUrl(DEFAULT_PFP);
            }
        });
        return users;
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



    public User updateProfilePicture(Long userId, String url) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String finalUrl;

        if (url == null || url.isBlank()) {
            // Default profile picture
            finalUrl = baseUrl + "/pfp/" + DEFAULT_PFP;
        } else if (url.startsWith("/pfp/")) {
            // Frontend sent relative path → prepend base URL
            finalUrl = baseUrl + url;
        } else {
            // Already a full URL → just save it
            finalUrl = url;
        }

        user.setProfilePictureUrl(finalUrl);
        return userRepository.save(user);
    }

    public String getProfilePictureUrl(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String profilePicUrl = user.getProfilePictureUrl();

        if (profilePicUrl == null || profilePicUrl.isBlank()) {
            profilePicUrl = baseUrl + "/pfp/" + DEFAULT_PFP;
        }

        return profilePicUrl;
    }

    // Update only username and password
    public User updateUsernameAndPassword(Long userId, String newUsername, String newPassword) {
        User user = getUserById(userId); // fetch existing user

        // Update username if provided
        if (newUsername != null && !newUsername.isBlank() && !newUsername.equals(user.getUsername())) {
            if (userRepository.existsByUsername(newUsername)) {
                throw new IllegalArgumentException("Username already taken");
            }
            user.setUsername(newUsername);
        }

        // Update password if provided
        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(new BCryptPasswordEncoder().encode(newPassword));
        }

        return userRepository.save(user);
    }


}
