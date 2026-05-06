package com.locksmith.platform.service;

import com.locksmith.platform.dto.CartItemView;
import com.locksmith.platform.dto.CartResponse;
import com.locksmith.platform.entity.CartItemEntity;
import com.locksmith.platform.model.Product;
import com.locksmith.platform.model.User;
import com.locksmith.platform.repository.CartItemRepository;
import com.locksmith.platform.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final JwtService jwtService;

    public CartService(CartItemRepository cartItemRepository, ProductRepository productRepository, JwtService jwtService) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.jwtService = jwtService;
    }

    public CartResponse getCart(String authorizationHeader) {
        JwtService.JwtPrincipal principal = jwtService.requirePrincipal(authorizationHeader);
        return buildResponse(cartItemRepository.findByUserIdOrderByCreatedAtAsc(principal.userId()));
    }

    public CartResponse addToCart(String authorizationHeader, Long productId, Integer quantity) {
        JwtService.JwtPrincipal principal = jwtService.requirePrincipal(authorizationHeader);
        int safeQuantity = quantity == null ? 1 : quantity;
        if (safeQuantity < 1) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        if (!product.isActive()) {
            throw new IllegalArgumentException("Product is not available");
        }

        CartItemEntity cartItem = cartItemRepository.findByUserIdAndProductId(principal.userId(), productId)
                .orElseGet(CartItemEntity::new);
        cartItem.setUser(referenceUser(principal.userId()));
        cartItem.setProduct(product);
        int nextQuantity = safeQuantity;
        if (cartItem.getId() != null) {
            nextQuantity = cartItem.getQuantity() + safeQuantity;
        }
        if (product.getStock() < nextQuantity) {
            throw new IllegalArgumentException("Insufficient stock");
        }
        cartItem.setQuantity(nextQuantity);
        cartItemRepository.save(cartItem);
        return getCart(authorizationHeader);
    }

    public CartResponse updateQuantity(String authorizationHeader, Long itemId, Integer quantity) {
        JwtService.JwtPrincipal principal = jwtService.requirePrincipal(authorizationHeader);
        CartItemEntity cartItem = cartItemRepository.findByIdAndUserId(itemId, principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));

        if (quantity == null || quantity < 1) {
            cartItemRepository.delete(cartItem);
            return getCart(authorizationHeader);
        }

        if (cartItem.getProduct().getStock() < quantity) {
            throw new IllegalArgumentException("Insufficient stock");
        }

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);
        return getCart(authorizationHeader);
    }

    public CartResponse removeItem(String authorizationHeader, Long itemId) {
        JwtService.JwtPrincipal principal = jwtService.requirePrincipal(authorizationHeader);
        CartItemEntity cartItem = cartItemRepository.findByIdAndUserId(itemId, principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));
        cartItemRepository.delete(cartItem);
        return getCart(authorizationHeader);
    }

    public void clearCart(Long userId) {
        List<CartItemEntity> items = cartItemRepository.findByUserIdOrderByCreatedAtAsc(userId);
        cartItemRepository.deleteAll(items);
    }

    public List<CartItemEntity> getCartEntities(Long userId) {
        return cartItemRepository.findByUserIdOrderByCreatedAtAsc(userId);
    }

    private User referenceUser(Long userId) {
        User user = new User();
        user.setId(userId);
        return user;
    }

    private CartResponse buildResponse(List<CartItemEntity> items) {
        List<CartItemView> views = items.stream().map(item -> {
            BigDecimal subtotal = item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            return new CartItemView(
                    item.getId(),
                    item.getProduct().getId(),
                    item.getQuantity(),
                    item.getProduct().getName(),
                    item.getProduct().getDescription(),
                    item.getProduct().getPrice(),
                    item.getProduct().getStock(),
                    item.getProduct().getImageUrl(),
                    subtotal
            );
        }).toList();

        BigDecimal total = views.stream()
                .map(CartItemView::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartResponse(views, total);
    }
}
