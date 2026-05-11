package com.locksmith.platform.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "order_location_history")
public class OrderLocationHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    @SuppressWarnings("unused")
    private Long orderId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "order_id", nullable = false, insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "FKjxisdtu3t0y0ar7xxodn1ky37"))
    private OrderEntity order;

    @Column(name = "admin_name", nullable = false, length = 120)
    private String adminName;

    @Column(name = "processing_status", nullable = false, length = 40)
    private String processingStatus;

    @Column(name = "location_note", length = 255)
    private String locationNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public OrderEntity getOrder() {
        return order;
    }

    public void setOrder(OrderEntity order) {
        this.order = order;
        this.orderId = order == null ? null : order.getId();
    }

    public String getAdminName() {
        return adminName;
    }

    public void setAdminName(String adminName) {
        this.adminName = adminName;
    }

    public String getProcessingStatus() {
        return processingStatus;
    }

    public void setProcessingStatus(String processingStatus) {
        this.processingStatus = processingStatus;
    }

    public String getLocationNote() {
        return locationNote;
    }

    public void setLocationNote(String locationNote) {
        this.locationNote = locationNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
