package com.basiccrud.controller;

import com.basiccrud.dto.ApiResponse;
import com.basiccrud.dto.tracker.TrackerRecordCreateRequest;
import com.basiccrud.dto.tracker.TrackerRecordResponse;
import com.basiccrud.dto.tracker.TrackerRecordUpdateRequest;
import com.basiccrud.entity.TrackerType;
import com.basiccrud.service.TrackerRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class TrackerRecordController {

    private final TrackerRecordService trackerRecordService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TrackerRecordResponse>>> getRecords(
            @RequestParam(required = false) TrackerType type,
            @PageableDefault(size = 50) Pageable pageable
    ) {
        Page<TrackerRecordResponse> records = trackerRecordService.getRecords(type, pageable);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TrackerRecordResponse>> createRecord(
            @Valid @RequestBody TrackerRecordCreateRequest request
    ) {
        TrackerRecordResponse created = trackerRecordService.createRecord(request);
        return ResponseEntity.ok(ApiResponse.success(created, "기록이 저장되었습니다"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRecord(@PathVariable Long id) {
        trackerRecordService.deleteRecord(id);
        return ResponseEntity.ok(ApiResponse.success(null, "기록이 삭제되었습니다"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TrackerRecordResponse>> updateRecord(
            @PathVariable Long id,
            @Valid @RequestBody TrackerRecordUpdateRequest request
    ) {
        TrackerRecordResponse updated = trackerRecordService.updateRecord(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "기록이 수정되었습니다"));
    }
}
