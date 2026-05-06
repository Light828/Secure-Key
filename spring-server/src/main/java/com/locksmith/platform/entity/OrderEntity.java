package com.locksmith.platform.entity;

import java.math.BigDecimal;
import java.time.Instant;

import com.locksmith.platform.model.User;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "orders")
public class OrderEntity {

    public enum PaymentStatus {
        pending,
        paid,
        failed
    }

    public enum ProcessingStatus {
        awaiting_payment("awaiting_payment"),
        new_order("new"),
        processing("processing"),
        completed("completed"),
        cancelled("cancelled");

        private final String dbValue;

        ProcessingStatus(String dbValue) {
            this.dbValue = dbValue;
        }

        public String getDbValue() {
            return dbValue;
        }

        public static ProcessingStatus fromDbValue(String value) {
            for (ProcessingStatus status : values()) {
                if (status.dbValue.equalsIgnoreCase(value)) {
                    return status;
                }
            }
            throw new IllegalArgumentException("Unsupported processing status: " + value);
        }
    }

    @jakarta.persistence.Converter(autoApply = false)
    public static class ProcessingStatusConverter implements jakarta.persistence.AttributeConverter<ProcessingStatus, String> {
        @Override
        public String convertToDatabaseColumn(ProcessingStatus attribute) {
            return attribute == null ? null : attribute.getDbValue();
        }

        @Override
        public ProcessingStatus convertToEntityAttribute(String dbData) {
            return dbData == null ? null : ProcessingStatus.fromDbValue(dbData);
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", unique = true, nullable = false, length = 20)
    private String orderNumber;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "paypal_order_id", unique = true, length = 80)
    private String paypalOrderId;

    @Column(name = "paypal_capture_id", length = 80)
    private String paypalCaptureId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(nullable = false, length = 10)
    private String currency = "ZAR";

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.pending;

    @Column(name = "processing_status", nullable = false)
    @Convert(converter = ProcessingStatusConverter.class)
    private ProcessingStatus processingStatus = ProcessingStatus.awaiting_payment;

@Column(name = "location_note", length = 255)
    private String locationNote;

    @Column(name = "delivery_type", length = 10)
    private String deliveryType;

    @Column(name = "delivery_address", length = 500, columnDefinition = "TEXT")
    private String deliveryAddress;

    @Column(name = "delivery_distance_km", precision = 5, scale = 2)
    private BigDecimal deliveryDistanceKm;

    @Column(name = "delivery_fee", precision = 8, scale = 2)
    private BigDecimal deliveryFee;

    @Column(name = "collect_time")
    private Instant collectTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getPaypalOrderId() {
        return paypalOrderId;
    }

    public void setPaypalOrderId(String paypalOrderId) {
        this.paypalOrderId = paypalOrderId;
    }

    public String getPaypalCaptureId() {
        return paypalCaptureId;
    }

    public void setPaypalCaptureId(String paypalCaptureId) {
        this.paypalCaptureId = paypalCaptureId;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public ProcessingStatus getProcessingStatus() {
        return processingStatus;
    }

    public void setProcessingStatus(ProcessingStatus processingStatus) {
        this.processingStatus = processingStatus;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getLocationNote() {
        return locationNote;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public void setLocationNote(String locationNote) {
        this.locationNote = locationNote;
    }

    public String getDeliveryType() {
        return deliveryType;
    }

    public void setDeliveryType(String deliveryType) {
        this.deliveryType = deliveryType;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public BigDecimal getDeliveryDistanceKm() {
        return deliveryDistanceKm;
    }

    public void setDeliveryDistanceKm(BigDecimal deliveryDistanceKm) {
        this.deliveryDistanceKm = deliveryDistanceKm;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(BigDecimal deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public Instant getCollectTime() {
        return collectTime;
    }

    public void setCollectTime(Instant collectTime) {
        this.collectTime = collectTime;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
