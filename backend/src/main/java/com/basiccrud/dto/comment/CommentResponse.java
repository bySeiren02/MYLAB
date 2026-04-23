package com.basiccrud.dto.comment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {

    private Long id;
    private Long postId;
    private Long parentId;  // null이면 최상위 댓글
    private String content;
    private Long authorId;
    private String authorName;
    private LocalDateTime createdAt;
    private List<CommentResponse> replies;  // 대댓글 목록 (1단계만)
}
