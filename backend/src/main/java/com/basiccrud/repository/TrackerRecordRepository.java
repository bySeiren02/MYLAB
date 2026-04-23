package com.basiccrud.repository;

import com.basiccrud.entity.TrackerRecord;
import com.basiccrud.entity.TrackerType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackerRecordRepository extends JpaRepository<TrackerRecord, Long> {
    Page<TrackerRecord> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);
    Page<TrackerRecord> findByAuthorIdAndTypeOrderByCreatedAtDesc(Long authorId, TrackerType type, Pageable pageable);
}
