package com.locksmith.platform.dto;

import java.math.BigDecimal;

public record CartItemView(
        Long id,
        Long productId,
        Integer quantity,
        String name,
        String description,
        BigDecimal price,
        Integer stock,
        String imageUrl,
        BigDecimal subtotal
) {
}
