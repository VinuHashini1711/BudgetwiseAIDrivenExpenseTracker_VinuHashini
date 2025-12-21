package com.budgetwise.service;

import com.budgetwise.dto.AuthRequest;
import com.budgetwise.dto.AuthResponse;
import com.budgetwise.dto.RegisterRequest;
import com.budgetwise.model.Role;
import com.budgetwise.model.User;
import com.budgetwise.repository.UserRepository;
import com.budgetwise.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    // ---------------- REGISTER ----------------
    public AuthResponse register(RegisterRequest request) {

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        if (request.getCaptchaValue() == null || request.getCaptchaValue().trim().isEmpty()) {
            throw new RuntimeException("Captcha is required");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // Create new user without profile image
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.ROLE_USER);

        userRepository.save(user);

        var token = jwtTokenProvider.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .username(user.getUsername())
                .message("Registration successful")
                .build();
    }

    // ---------------- LOGIN ----------------
    public AuthResponse authenticate(AuthRequest request) {
        var userOpt = userRepository.findByEmail(request.getEmailOrUsername())
                .or(() -> userRepository.findByUsername(request.getEmailOrUsername()));

        var user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
        );

        var token = jwtTokenProvider.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .username(user.getUsername())
                .message("Login successful")
                .build();
    }

    // ---------------- LOGOUT ----------------
    public void logout(String token) {
        System.out.println("User logged out successfully with token: " + token);
    }
}
