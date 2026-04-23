package com.basiccrud.service;

import com.basiccrud.dto.post.PostCreateRequest;
import com.basiccrud.dto.post.PostResponse;
import com.basiccrud.dto.post.PostUpdateRequest;
import com.basiccrud.entity.Post;
import com.basiccrud.entity.User;
import com.basiccrud.exception.ForbiddenException;
import com.basiccrud.exception.ResourceNotFoundException;
import com.basiccrud.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public Page<PostResponse> getPosts(Pageable pageable) {
        return postRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("게시글을 찾을 수 없습니다"));
        return toResponse(post);
    }

    @Transactional
    public PostResponse createPost(PostCreateRequest request) {
        User author = currentUserService.getCurrentUser();
        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .author(author)
                .build();
        post = postRepository.save(post);
        log.info("Post created - postId: {}, authorId: {}, title: {}", post.getId(), author.getId(), post.getTitle());
        return toResponse(post);
    }

    @Transactional
    public PostResponse updatePost(Long id, PostUpdateRequest request) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("게시글을 찾을 수 없습니다"));
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!post.getAuthor().getId().equals(currentUserId)) {
            log.warn("Post update forbidden - postId: {}, currentUserId: {}", id, currentUserId);
            throw new ForbiddenException("본인의 게시글만 수정할 수 있습니다");
        }
        post.update(request.getTitle(), request.getContent());
        log.info("Post updated - postId: {}", id);
        return toResponse(post);
    }

    @Transactional
    public void deletePost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("게시글을 찾을 수 없습니다"));
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!post.getAuthor().getId().equals(currentUserId)) {
            log.warn("Post delete forbidden - postId: {}, currentUserId: {}", id, currentUserId);
            throw new ForbiddenException("본인의 게시글만 삭제할 수 있습니다");
        }
        postRepository.delete(post);
        log.info("Post deleted - postId: {}", id);
    }

    private PostResponse toResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getName())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
