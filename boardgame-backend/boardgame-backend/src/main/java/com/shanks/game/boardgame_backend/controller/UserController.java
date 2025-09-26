package com.shanks.game.boardgame_backend.controller;


import com.shanks.game.boardgame_backend.dao.service.UserService;
import com.shanks.game.boardgame_backend.dto.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

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
    public User increaseRank(@PathVariable Long id) {
        int points=3;
        return userService.increaseRank(id, points);
    }

    // ✅ Decrease Rank
    @PutMapping("/{id}/decrease-rank")
    public User decreaseRank(@PathVariable Long id) {
        int points = -1;
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

    @PutMapping("/{id}/profile-picture")
    public ResponseEntity<User> updateProfilePicture(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            // ✅ Create folder if not exists
            Path folder = Paths.get("src/main/resources/static/pfp/");
            Files.createDirectories(folder);

            // ✅ Unique filename to avoid overwriting
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = folder.resolve(fileName);

            // ✅ Save the file locally
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // ✅ Public URL (served from static folder)
            String url = "/pfp/" + fileName;

            // ✅ Update user in DB and get updated user back
            User updatedUser = userService.updateProfilePicture(id, url);
            return ResponseEntity.ok(updatedUser);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    // --- Get profile picture URL endpoint
    @GetMapping("/{userId}/profile-picture")
    public ResponseEntity<Resource> getProfilePicture(@PathVariable Long userId) {
        try {
            // Get the profile picture URL from your service
            String profilePicUrl = userService.getProfilePictureUrl(userId);

            // Extract just the filename from the URL (remove base URL)
            String filename = profilePicUrl.replaceFirst(".*/pfp/", "");
            Path filePath = Paths.get("src/main/resources/static/pfp/").resolve(filename);

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("File not found");
            }

            // Set proper content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }




}
