package com.locksmith.platform.dto;

import java.math.BigDecimal;
import java.util.List;

public record OrderSummaryView(
        Long id,
        String orderNumber,
        BigDecimal total,
        String currency,
        String paymentStatus,
        String processingStatus,
        String locationNote,
        List<AdminOrderItemView> items,
        List<OrderLocationHistoryView> locationHistory,
        String createdAt
) {
}
