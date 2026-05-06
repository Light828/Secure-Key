package com.locksmith.platform.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(List<CartItemView> items, BigDecimal total) {
}
