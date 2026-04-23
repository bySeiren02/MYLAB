package com.basiccrud.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CommentCreateRequest {

    @NotNull(message = "게시글 ID는 필수입니다")
    private Long postId;

    /** 대댓글일 때 부모 댓글 ID (없으면 null = 최상위 댓글) */
    private Long parentId;

    @NotBlank(message = "댓글 내용은 필수입니다")
    private String content;
}
