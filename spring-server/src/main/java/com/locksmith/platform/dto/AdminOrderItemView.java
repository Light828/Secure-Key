package com.locksmith.platform.dto;

import java.math.BigDecimal;

public record AdminOrderItemView(
        Long id,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
}