package com.basiccrud.dto.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PostCreateRequest {

    @NotBlank(message = "제목은 필수입니다")
    @Size(max = 500)
    private String title;

    @NotBlank(message = "내용은 필수입니다")
    private String content;
}
