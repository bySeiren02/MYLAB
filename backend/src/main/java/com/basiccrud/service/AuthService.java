package com.basiccrud.service;

import com.basiccrud.dto.auth.AuthResponse;
import com.basiccrud.dto.auth.LoginRequest;
import com.basiccrud.dto.auth.SignupRequest;
import com.basiccrud.entity.User;
import com.basiccrud.exception.DuplicateEmailException;
import com.basiccrud.repository.UserRepository;
import com.basiccrud.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Signup failed - duplicate email: {}", request.getEmail());
            throw new DuplicateEmailException("이미 사용 중인 이메일입니다");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .build();
        userRepository.save(user);
        log.info("Signup success - userId: {}, email: {}", user.getId(), user.getEmail());

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return buildAuthResponse(token, user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
        log.info("Login success - userId: {}, email: {}", user.getId(), user.getEmail());

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return buildAuthResponse(token, user);
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(AuthResponse.UserResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .name(user.getName())
                        .createdAt(user.getCreatedAt().format(formatter))
                        .build())
                .build();
    }
}
