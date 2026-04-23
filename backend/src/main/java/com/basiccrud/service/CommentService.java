package com.basiccrud.service;

import com.basiccrud.dto.comment.CommentCreateRequest;
import com.basiccrud.dto.comment.CommentResponse;
import com.basiccrud.entity.Comment;
import com.basiccrud.entity.Post;
import com.basiccrud.exception.ForbiddenException;
import com.basiccrud.exception.ResourceNotFoundException;
import com.basiccrud.repository.CommentRepository;
import com.basiccrud.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByPostId(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new ResourceNotFoundException("게시글을 찾을 수 없습니다");
        }
        List<Comment> all = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        List<CommentResponse> flat = all.stream().map(this::toResponse).collect(Collectors.toList());
        return buildCommentTree(flat);
    }

    /** 최상위 댓글만 반환하고, 각각의 replies에 대댓글(1단계)만 채움 */
    private List<CommentResponse> buildCommentTree(List<CommentResponse> flat) {
        List<CommentResponse> roots = flat.stream()
                .filter(c -> c.getParentId() == null)
                .collect(Collectors.toList());
        List<CommentResponse> withReplies = flat.stream()
                .filter(c -> c.getParentId() != null)
                .collect(Collectors.toList());
        return roots.stream().map(root -> {
            List<CommentResponse> replies = withReplies.stream()
                    .filter(c -> root.getId().equals(c.getParentId()))
                    .collect(Collectors.toList());
            return CommentResponse.builder()
                    .id(root.getId())
                    .postId(root.getPostId())
                    .parentId(root.getParentId())
                    .content(root.getContent())
                    .authorId(root.getAuthorId())
                    .authorName(root.getAuthorName())
                    .createdAt(root.getCreatedAt())
                    .replies(replies)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse createComment(CommentCreateRequest request) {
        Long postId = request.getPostId();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("게시글을 찾을 수 없습니다"));
        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("부모 댓글을 찾을 수 없습니다"));
            if (!parent.getPost().getId().equals(postId)) {
                throw new ResourceNotFoundException("해당 게시글의 댓글이 아닙니다");
            }
            // 대대댓글 불가: 부모가 이미 대댓글이면 안 됨
            if (parent.getParent() != null) {
                throw new ForbiddenException("대댓글에는 답글을 달 수 없습니다");
            }
        }
        var author = currentUserService.getCurrentUser();
        Comment comment = Comment.builder()
                .post(post)
                .parent(parent)
                .content(request.getContent())
                .author(author)
                .build();
        comment = commentRepository.save(comment);
        log.info("Comment added - commentId: {}, postId: {}, parentId: {}, authorId: {}",
                comment.getId(), postId, request.getParentId(), author.getId());
        return toResponse(comment);
    }

    @Transactional
    public void deleteComment(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("댓글을 찾을 수 없습니다"));
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!comment.getAuthor().getId().equals(currentUserId)) {
            log.warn("Comment delete forbidden - commentId: {}, currentUserId: {}", id, currentUserId);
            throw new ForbiddenException("본인의 댓글만 삭제할 수 있습니다");
        }
        // 대댓글이 있으면 먼저 삭제 (1단계만 있으므로 한 번만)
        commentRepository.deleteByParent_Id(id);
        commentRepository.delete(comment);
        log.info("Comment deleted - commentId: {}", id);
    }

    private CommentResponse toResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .content(comment.getContent())
                .authorId(comment.getAuthor().getId())
                .authorName(comment.getAuthor().getName())
                .createdAt(comment.getCreatedAt())
                .replies(null)
                .build();
    }
}
