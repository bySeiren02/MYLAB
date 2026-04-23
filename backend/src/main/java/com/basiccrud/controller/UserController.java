package com.basiccrud.controller;

import com.basiccrud.dto.ApiResponse;
import com.basiccrud.dto.user.UserResponse;
import com.basiccrud.dto.user.UserUpdateRequest;
import com.basiccrud.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 API: 내 정보 수정
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(@Valid @RequestBody UserUpdateRequest request) {
        UserResponse user = userService.updateMe(request);
        return ResponseEntity.ok(ApiResponse.success(user, "수정되었습니다"));
    }
}
