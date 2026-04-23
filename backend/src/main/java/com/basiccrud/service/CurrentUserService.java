package com.basiccrud.service;

import com.basiccrud.entity.User;
import com.basiccrud.exception.ResourceNotFoundException;
import com.basiccrud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * 현재 로그인한 사용자 ID/엔티티 조회
 */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return Long.parseLong(auth.getName());
    }

    public User getCurrentUser() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw new ResourceNotFoundException("로그인이 필요합니다");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다"));
    }
}
