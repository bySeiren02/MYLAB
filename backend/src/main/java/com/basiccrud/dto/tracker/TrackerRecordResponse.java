package com.basiccrud.dto.tracker;

import com.basiccrud.entity.TrackerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackerRecordResponse {
    private Long id;
    private TrackerType type;
    private LocalDate recordDate;
    private String note;
    private String details;
    private Double amount;
    private Double distanceKm;
    private Integer durationMinutes;
    private Integer calories;
    private String authorName;
    private LocalDateTime createdAt;
}
