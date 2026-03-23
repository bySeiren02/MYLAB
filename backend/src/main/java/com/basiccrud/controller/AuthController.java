package com.basiccrud.controller;

import com.basiccrud.dto.ApiResponse;
import com.basiccrud.dto.auth.AuthResponse;
import com.basiccrud.dto.auth.LoginRequest;
import com.basiccrud.dto.auth.SignupRequest;
import com.basiccrud.dto.user.UserResponse;
import com.basiccrud.service.AuthService;
import com.basiccrud.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 인증 API: 회원가입, 로그인, 내 정보 조회
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return ResponseEntity.ok(ApiResponse.success(response, "회원가입이 완료되었습니다"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "로그인 성공"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me() {
        UserResponse user = userService.getMe();
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
