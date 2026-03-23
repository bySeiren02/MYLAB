package com.basiccrud.controller;

import com.basiccrud.dto.ApiResponse;
import com.basiccrud.dto.post.PostCreateRequest;
import com.basiccrud.dto.post.PostResponse;
import com.basiccrud.dto.post.PostUpdateRequest;
import com.basiccrud.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 게시판 API: 게시글 CRUD
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getPosts(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PostResponse> posts = postService.getPosts(pageable);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(@PathVariable Long id) {
        PostResponse post = postService.getPost(id);
        return ResponseEntity.ok(ApiResponse.success(post));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(@Valid @RequestBody PostCreateRequest request) {
        PostResponse post = postService.createPost(request);
        return ResponseEntity.ok(ApiResponse.success(post, "게시글이 작성되었습니다"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostUpdateRequest request) {
        PostResponse post = postService.updatePost(id, request);
        return ResponseEntity.ok(ApiResponse.success(post, "수정되었습니다"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.success(null, "삭제되었습니다"));
    }
}
