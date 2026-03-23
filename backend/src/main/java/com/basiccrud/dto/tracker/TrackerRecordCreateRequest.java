package com.basiccrud.dto.tracker;

import com.basiccrud.entity.TrackerType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class TrackerRecordCreateRequest {

    @NotNull(message = "기록 타입은 필수입니다")
    private TrackerType type;

    @NotNull(message = "기록 날짜는 필수입니다")
    private LocalDate recordDate;

    @Size(max = 200)
    private String note;

    @NotBlank(message = "상세 기록은 필수입니다")
    private String details;

    private Double amount;
    private Double distanceKm;
    private Integer durationMinutes;
    private Integer calories;
}
