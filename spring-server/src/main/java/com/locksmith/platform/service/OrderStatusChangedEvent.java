package com.locksmith.platform.service;

public record OrderStatusChangedEvent(Long orderId, String previousStatus, String nextStatus) {
}
