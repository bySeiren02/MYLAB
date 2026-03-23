package com.basiccrud.service;

import com.basiccrud.dto.tracker.TrackerRecordCreateRequest;
import com.basiccrud.dto.tracker.TrackerRecordResponse;
import com.basiccrud.dto.tracker.TrackerRecordUpdateRequest;
import com.basiccrud.entity.TrackerRecord;
import com.basiccrud.entity.TrackerType;
import com.basiccrud.entity.User;
import com.basiccrud.exception.ForbiddenException;
import com.basiccrud.exception.ResourceNotFoundException;
import com.basiccrud.repository.TrackerRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TrackerRecordService {

    private final TrackerRecordRepository trackerRecordRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public Page<TrackerRecordResponse> getRecords(TrackerType type, Pageable pageable) {
        Long userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            throw new ResourceNotFoundException("로그인이 필요합니다");
        }

        Page<TrackerRecord> page = (type == null)
                ? trackerRecordRepository.findByAuthorIdOrderByCreatedAtDesc(userId, pageable)
                : trackerRecordRepository.findByAuthorIdAndTypeOrderByCreatedAtDesc(userId, type, pageable);
        return page.map(this::toResponse);
    }

    @Transactional
    public TrackerRecordResponse createRecord(TrackerRecordCreateRequest request) {
        User author = currentUserService.getCurrentUser();
        TrackerRecord record = TrackerRecord.builder()
                .type(request.getType())
                .recordDate(request.getRecordDate())
                .note(request.getNote())
                .details(request.getDetails())
                .amount(request.getAmount())
                .distanceKm(request.getDistanceKm())
                .durationMinutes(request.getDurationMinutes())
                .calories(request.getCalories())
                .author(author)
                .build();
        return toResponse(trackerRecordRepository.save(record));
    }

    @Transactional
    public void deleteRecord(Long id) {
        TrackerRecord record = trackerRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("기록을 찾을 수 없습니다"));
        Long userId = currentUserService.getCurrentUserId();
        if (userId == null || !record.getAuthor().getId().equals(userId)) {
            throw new ForbiddenException("본인의 기록만 삭제할 수 있습니다");
        }
        trackerRecordRepository.delete(record);
    }

    @Transactional
    public TrackerRecordResponse updateRecord(Long id, TrackerRecordUpdateRequest request) {
        TrackerRecord record = trackerRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("기록을 찾을 수 없습니다"));
        Long userId = currentUserService.getCurrentUserId();
        if (userId == null || !record.getAuthor().getId().equals(userId)) {
            throw new ForbiddenException("본인의 기록만 수정할 수 있습니다");
        }

        record.update(
                request.getRecordDate(),
                request.getNote(),
                request.getDetails(),
                request.getAmount(),
                request.getDistanceKm(),
                request.getDurationMinutes(),
                request.getCalories()
        );
        return toResponse(record);
    }

    private TrackerRecordResponse toResponse(TrackerRecord record) {
        return TrackerRecordResponse.builder()
                .id(record.getId())
                .type(record.getType())
                .recordDate(record.getRecordDate())
                .note(record.getNote())
                .details(record.getDetails())
                .amount(record.getAmount())
                .distanceKm(record.getDistanceKm())
                .durationMinutes(record.getDurationMinutes())
                .calories(record.getCalories())
                .authorName(record.getAuthor().getName())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
