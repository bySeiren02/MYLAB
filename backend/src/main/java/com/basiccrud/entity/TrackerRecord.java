package com.basiccrud.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tracker_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TrackerRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TrackerType type;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(length = 200)
    private String note;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String details;

    @Column(precision = 12, scale = 2)
    private Double amount;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    private Integer calories;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public void update(
            LocalDate recordDate,
            String note,
            String details,
            Double amount,
            Double distanceKm,
            Integer durationMinutes,
            Integer calories
    ) {
        this.recordDate = recordDate;
        this.note = note;
        this.details = details;
        this.amount = amount;
        this.distanceKm = distanceKm;
        this.durationMinutes = durationMinutes;
        this.calories = calories;
    }
}
