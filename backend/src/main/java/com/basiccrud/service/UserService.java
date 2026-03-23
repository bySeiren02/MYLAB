package com.basiccrud.service;

import com.basiccrud.dto.user.UserResponse;
import com.basiccrud.dto.user.UserUpdateRequest;
import com.basiccrud.entity.User;
import com.basiccrud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public UserResponse getMe() {
        User user = currentUserService.getCurrentUser();
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateMe(UserUpdateRequest request) {
        User user = currentUserService.getCurrentUser();
        user.updateName(request.getName());
        log.info("User updated - userId: {}, name: {}", user.getId(), request.getName());
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
