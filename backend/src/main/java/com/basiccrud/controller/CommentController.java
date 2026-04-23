package com.basiccrud.controller;

import com.basiccrud.dto.ApiResponse;
import com.basiccrud.dto.comment.CommentCreateRequest;
import com.basiccrud.dto.comment.CommentResponse;
import com.basiccrud.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 댓글 API: 댓글 작성, 목록 조회, 삭제
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(@PathVariable Long postId) {
        List<CommentResponse> comments = commentService.getCommentsByPostId(postId);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @PostMapping("/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @Valid @RequestBody CommentCreateRequest request) {
        CommentResponse comment = commentService.createComment(request);
        return ResponseEntity.ok(ApiResponse.success(comment, "댓글이 등록되었습니다"));
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.ok(ApiResponse.success(null, "삭제되었습니다"));
    }
}
