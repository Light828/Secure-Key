package com.locksmith.platform.controller;

import com.locksmith.platform.dto.CartResponse;
import com.locksmith.platform.service.CartService;
import com.locksmith.platform.service.DistanceCalculationService;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;
    private final DistanceCalculationService distanceCalculationService;

    public CartController(CartService cartService, DistanceCalculationService distanceCalculationService) {
        this.cartService = cartService;
        this.distanceCalculationService = distanceCalculationService;
    }

    @PostMapping("/calculate-delivery-fee")
    public Map<String, Object> calculateDeliveryFee(@RequestHeader("Authorization") String authorization, @RequestBody DeliveryFeeRequest request) {
        // Calculate distance from store to address
        double distanceKm = request.deliveryType().equals("deliver") && request.address() != null
                ? distanceCalculationService.calculateDistance(request.address())
                : 0.0;

        BigDecimal fee = BigDecimal.ZERO;
        if (request.deliveryType().equals("deliver") && request.address() != null) {
            // R4 per km
            fee = BigDecimal.valueOf(distanceKm * 4);
        }
        return Map.of(
            "deliveryType", request.deliveryType(),
            "distanceKm", distanceKm,
            "deliveryFee", fee,
            "addressRequired", request.deliveryType().equals("deliver"),
            "collectTimeRequired", request.deliveryType().equals("collect")
        );
    }

    public record DeliveryFeeRequest(String deliveryType, String address, String collectTime) {}

    @GetMapping
    public CartResponse getCart(@RequestHeader("Authorization") String authorization) {
        return cartService.getCart(authorization);
    }

    @PostMapping("/add")
    public CartResponse addToCart(@RequestHeader("Authorization") String authorization, @RequestBody AddToCartRequest request) {
        return cartService.addToCart(authorization, request.productId(), request.quantity());
    }

    @PatchMapping("/{itemId}")
    public CartResponse updateQuantity(@RequestHeader("Authorization") String authorization, @PathVariable Long itemId, @RequestBody UpdateQuantityRequest request) {
        return cartService.updateQuantity(authorization, itemId, request.quantity());
    }

    @DeleteMapping("/{itemId}")
    public CartResponse removeItem(@RequestHeader("Authorization") String authorization, @PathVariable Long itemId) {
        return cartService.removeItem(authorization, itemId);
    }

    public record AddToCartRequest(@NotNull Long productId, Integer quantity) {
    }

    public record UpdateQuantityRequest(@Min(0) Integer quantity) {
    }
}