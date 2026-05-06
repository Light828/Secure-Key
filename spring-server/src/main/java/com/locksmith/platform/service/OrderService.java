package com.locksmith.platform.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.locksmith.platform.dto.AdminOrderItemView;
import com.locksmith.platform.dto.AdminOrderView;
import com.locksmith.platform.dto.OrderLocationHistoryView;
import com.locksmith.platform.dto.OrderSummaryView;
import com.locksmith.platform.entity.CartItemEntity;
import com.locksmith.platform.entity.OrderEntity;
import com.locksmith.platform.entity.OrderItemEntity;
import com.locksmith.platform.entity.OrderLocationHistoryEntity;
import com.locksmith.platform.model.Product;
import com.locksmith.platform.model.User;
import com.locksmith.platform.repository.OrderItemRepository;
import com.locksmith.platform.repository.OrderLocationHistoryRepository;
import com.locksmith.platform.repository.OrderRepository;
import com.locksmith.platform.repository.ProductRepository;
import com.locksmith.platform.repository.UserRepository;

@Service
@Transactional
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderLocationHistoryRepository orderLocationHistoryRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartService cartService;
    private final PayPalService payPalService;
    private final JwtService jwtService;
    private final ApplicationEventPublisher eventPublisher;

    public OrderService(OrderRepository orderRepository, OrderItemRepository orderItemRepository, OrderLocationHistoryRepository orderLocationHistoryRepository, ProductRepository productRepository, UserRepository userRepository, CartService cartService, PayPalService payPalService, JwtService jwtService, ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderLocationHistoryRepository = orderLocationHistoryRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.cartService = cartService;
        this.payPalService = payPalService;
        this.jwtService = jwtService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Generate a unique order number (e.g., ORD-001, ORD-002, ...)
     */
    private String generateOrderNumber() {
        Long maxId = orderRepository.findMaxId();
        long nextId = (maxId == null ? 0 : maxId) + 1;
        return String.format("ORD-%06d", nextId);
    }

    public PayPalService.PayPalOrder createPaypalOrder(String authorizationHeader) {
        JwtService.JwtPrincipal principal = jwtService.requirePrincipal(authorizationHeader);
        Long userId = principal.userId();
        if (userId == null) throw new IllegalArgumentException("Invalid token: missing user id");
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<CartItemEntity> cartItems = cartService.getCartEntities(userId);
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        BigDecimal total = calculateTotal(cartItems);
        String approveBaseUrl = "http://localhost:8080/api/orders/approve";
        PayPalService.PayPalOrder paypalOrder = payPalService.createOrder(total, approveBaseUrl);

        OrderEntity order = new OrderEntity();
        order.setOrderNumber(generateOrderNumber());
        order.setUser(user);
        order.setPaypalOrderId(paypalOrder.paypalOrderId());
        order.setTotal(total);
        order.setCurrency("ZAR");
        order.setPaymentStatus(OrderEntity.PaymentStatus.pending);
        order.setProcessingStatus(OrderEntity.ProcessingStatus.awaiting_payment);
        orderRepository.save(order);

        return new PayPalService.PayPalOrder(paypalOrder.paypalOrderId(), paypalOrder.approveLink(), total, paypalOrder.currency());
    }

    /**
     * Create a pending order for Stripe checkout so the frontend can show it immediately.
     */
    public OrderEntity createStripePendingOrder(String authorizationHeader, String stripeSessionOrderId, BigDecimal total, String currency, String deliveryType, String deliveryAddress, BigDecimal deliveryDistanceKm, BigDecimal deliveryFee) {
        JwtService.JwtPrincipal principal = jwtService.requirePrincipal(authorizationHeader);
        Long userId = principal.userId();
        if (userId == null) throw new IllegalArgumentException("Invalid token: missing user id");
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        OrderEntity order = new OrderEntity();
        order.setOrderNumber(generateOrderNumber());
        order.setUser(user);
        order.setPaypalOrderId(stripeSessionOrderId);
        order.setTotal(total);
        order.setCurrency(currency == null ? "ZAR" : currency);
        order.setPaymentStatus(OrderEntity.PaymentStatus.pending);
        order.setProcessingStatus(OrderEntity.ProcessingStatus.awaiting_payment);
        order.setDeliveryType(deliveryType);
        order.setDeliveryAddress(deliveryAddress);
        order.setDeliveryDistanceKm(deliveryDistanceKm);
        order.setDeliveryFee(deliveryFee);
        orderRepository.save(order);
        return order;
    }

    public CaptureResult capturePaypalOrder(String authorizationHeader, String paypalOrderId) {
        JwtService.JwtPrincipal principal = jwtService.requirePrincipal(authorizationHeader);
        Long userId = principal.userId();
        if (userId == null) throw new IllegalArgumentException("Invalid token: missing user id");
        OrderEntity order = orderRepository.findByPaypalOrderId(paypalOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to the authenticated user");
        }

        if (order.getPaymentStatus() == OrderEntity.PaymentStatus.paid) {
            return new CaptureResult("Order already captured", order.getId());
        }

        List<CartItemEntity> cartItems = cartService.getCartEntities(userId);
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        BigDecimal currentTotal = calculateTotal(cartItems);
        if (order.getTotal().compareTo(currentTotal) != 0) {
            throw new IllegalArgumentException("Cart changed after payment started");
        }

        String captureId = payPalService.captureOrder(paypalOrderId);

        for (CartItemEntity cartItem : cartItems) {
            Long productId = cartItem.getProduct().getId();
            if (productId == null) {
                throw new IllegalArgumentException("Product id is missing");
            }
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            if (product.getStock() < cartItem.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for " + product.getName());
            }
        }

        for (CartItemEntity cartItem : cartItems) {
            Long productId = cartItem.getProduct().getId();
            if (productId == null) {
                throw new IllegalArgumentException("Product id is missing");
            }
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItemEntity orderItem = new OrderItemEntity();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setUnitPrice(product.getPrice());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            orderItemRepository.save(orderItem);
        }

        order.setPaymentStatus(OrderEntity.PaymentStatus.paid);
        order.setProcessingStatus(OrderEntity.ProcessingStatus.new_order);
    order.setPaypalCaptureId(captureId);
        orderRepository.save(order);

        cartService.clearCart(userId);
        return new CaptureResult("Payment captured and order created successfully", order.getId());
    }

    /**
     * Capture a Stripe payment: create order items from cart and mark order as paid
     * @param authorizationHeader JWT token
     * @param stripeSessionId Stripe session ID
     * @param deliveryType "collect" or "deliver"
     * @param deliveryAddress Full delivery address (for deliver type)
     * @param deliveryDistanceKm Distance in km (optional, from Google Maps API)
     * @param deliveryFee Delivery fee amount (optional, calculated as 4/km)
     * @return CaptureResult with order ID
     */
    public CaptureResult captureStripePayment(
            String authorizationHeader,
            String stripeSessionId,
            String deliveryType,
            String deliveryAddress,
            BigDecimal deliveryDistanceKm,
            BigDecimal deliveryFee) {
        
        logger.info("captureStripePayment called with sessionId: {}", stripeSessionId);
        
        JwtService.JwtPrincipal principal = jwtService.requirePrincipal(authorizationHeader);
        Long userId = principal.userId();
        if (userId == null) throw new IllegalArgumentException("Invalid token: missing user id");
        logger.info("Processing Stripe payment for user: {}", userId);

        // Find order by stripe session ID prefix
        OrderEntity order = orderRepository.findByPaypalOrderId("STRIPE-" + stripeSessionId)
                .orElseGet(() -> {
                    // If not found, check cart and create a new order
                        User user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("User not found"));
                        List<CartItemEntity> cartItems = cartService.getCartEntities(userId);
                    if (cartItems.isEmpty()) {
                        throw new IllegalArgumentException("Cart is empty");
                    }
                    
                    BigDecimal total = calculateTotal(cartItems);
                    if (deliveryFee != null && deliveryFee.compareTo(BigDecimal.ZERO) > 0) {
                        total = total.add(deliveryFee);
                    }
                    
                    OrderEntity newOrder = new OrderEntity();
                    newOrder.setOrderNumber(generateOrderNumber());
                    newOrder.setUser(user);
                    newOrder.setPaypalOrderId("STRIPE-" + stripeSessionId);
                    newOrder.setTotal(total);
                    newOrder.setCurrency("ZAR");
                    newOrder.setDeliveryType(deliveryType);
                    newOrder.setDeliveryAddress(deliveryAddress);
                    newOrder.setDeliveryDistanceKm(deliveryDistanceKm);
                    newOrder.setDeliveryFee(deliveryFee);
                    logger.info("Created new order with id: {} for user: {}, total: {}", newOrder.getId(), userId, total);
                    return newOrder;
                });

        if (order.getPaymentStatus() == OrderEntity.PaymentStatus.paid) {
            logger.warn("Order {} already processed", order.getId());
            return new CaptureResult("Order already processed", order.getId());
        }

        List<CartItemEntity> cartItems = cartService.getCartEntities(userId);
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        // Create order items from cart
        for (CartItemEntity cartItem : cartItems) {
            Long productId = cartItem.getProduct().getId();
            if (productId == null) {
                throw new IllegalArgumentException("Product id is missing");
            }
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            if (product.getStock() < cartItem.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for " + product.getName());
            }
        }

        for (CartItemEntity cartItem : cartItems) {
            Long productId = cartItem.getProduct().getId();
            if (productId == null) {
                throw new IllegalArgumentException("Product id is missing");
            }
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItemEntity orderItem = new OrderItemEntity();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setUnitPrice(product.getPrice());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            orderItemRepository.save(orderItem);
        }

        order.setPaymentStatus(OrderEntity.PaymentStatus.paid);
        order.setProcessingStatus(OrderEntity.ProcessingStatus.new_order);
        orderRepository.save(order);
        logger.info("Order {} saved with payment status: PAID, processing status: NEW", order.getId());

        cartService.clearCart(userId);
        logger.info("Cart cleared for user: {}", userId);
        
        // Record initial location history entry
        recordLocationHistory(order, "Stripe Payment", OrderEntity.ProcessingStatus.new_order.getDbValue(), 
            "Order placed via Stripe. Delivery: " + deliveryType + 
            (deliveryAddress != null ? " to " + deliveryAddress : ""));
        
        logger.info("Successfully captured Stripe payment and created order: {}", order.getId());
        return new CaptureResult("Stripe payment captured and order created successfully", order.getId());
    }

    public List<OrderSummaryView> getMyOrders(String authorizationHeader) {
        JwtService.JwtPrincipal principal = jwtService.requirePrincipal(authorizationHeader);
        Long userId2 = principal.userId();
        if (userId2 == null) throw new IllegalArgumentException("Invalid token: missing user id");
        logger.info("getMyOrders called for user: {}", userId2);
        
        List<OrderSummaryView> orders = orderRepository.findByUserOrderByCreatedAtDesc(userRepository.getReferenceById(userId2))
                .stream()
                .map(order -> new OrderSummaryView(
                        order.getId(),
                        order.getOrderNumber(),
                        order.getTotal(),
                        order.getCurrency(),
                        order.getPaymentStatus().name(),
                        order.getProcessingStatus().getDbValue(),
                order.getLocationNote(),
                getOrderItems(order.getId()),
                getLocationHistory(order.getId()),
                        order.getCreatedAt() == null ? Instant.now().toString() : order.getCreatedAt().toString()
                ))
                .toList();
        
        logger.info("Found {} orders for user: {}", orders.size(), userId2);
        return orders;
    }

    public List<AdminOrderView> getAdminOrders(String authorizationHeader) {
        jwtService.requireAdmin(authorizationHeader);
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(order -> new AdminOrderView(
                        order.getId(),
                        order.getOrderNumber(),
                        order.getTotal(),
                        order.getCurrency(),
                        order.getPaymentStatus().name(),
                        order.getProcessingStatus().getDbValue(),
                    order.getLocationNote(),
                    getOrderItems(order.getId()),
                    getLocationHistory(order.getId()),
                        order.getCreatedAt() == null ? Instant.now().toString() : order.getCreatedAt().toString(),
                        order.getUser().getName(),
                        order.getUser().getEmail()
                ))
                .toList();
    }

            public void updateProcessingStatus(String authorizationHeader, Long orderId, String processingStatus, String locationNote) {
            JwtService.JwtPrincipal admin = jwtService.requireAdmin(authorizationHeader);
        Long safeOrderId = orderId;
        if (safeOrderId == null) {
            throw new IllegalArgumentException("Order id is missing");
        }
        OrderEntity order = orderRepository.findById(safeOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getPaymentStatus() != OrderEntity.PaymentStatus.paid) {
            throw new IllegalArgumentException("Cannot update order before payment is complete");
        }

        OrderEntity.ProcessingStatus nextStatus = OrderEntity.ProcessingStatus.fromDbValue(processingStatus);
        OrderEntity.ProcessingStatus previousStatus = order.getProcessingStatus();
        String normalizedLocationNote = normalizeLocationNote(locationNote);
        boolean statusChanged = previousStatus != nextStatus;
        boolean locationChanged = !equalsNullable(order.getLocationNote(), normalizedLocationNote);

        if (!statusChanged && !locationChanged) {
            return;
        }

        order.setProcessingStatus(nextStatus);
        order.setLocationNote(normalizedLocationNote);
        orderRepository.save(order);
        recordLocationHistory(order, admin.name(), nextStatus.getDbValue(), normalizedLocationNote);
        if (statusChanged) {
            eventPublisher.publishEvent(new OrderStatusChangedEvent(order.getId(), previousStatus.getDbValue(), nextStatus.getDbValue()));
        }
    }

    private void recordLocationHistory(OrderEntity order, String adminName, String processingStatus, String locationNote) {
        OrderLocationHistoryEntity entry = new OrderLocationHistoryEntity();
        entry.setOrder(order);
        entry.setAdminName(adminName == null || adminName.isBlank() ? "Admin" : adminName.trim());
        entry.setProcessingStatus(processingStatus);
        entry.setLocationNote(locationNote);
        orderLocationHistoryRepository.save(entry);
    }

    private List<OrderLocationHistoryView> getLocationHistory(Long orderId) {
        return orderLocationHistoryRepository.findByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(entry -> new OrderLocationHistoryView(
                        entry.getAdminName(),
                        entry.getProcessingStatus(),
                        entry.getLocationNote(),
                        entry.getCreatedAt() == null ? Instant.now().toString() : entry.getCreatedAt().toString()
                ))
                .toList();
    }

            private List<AdminOrderItemView> getOrderItems(Long orderId) {
            return orderItemRepository.findByOrderId(orderId).stream()
                .map(item -> new AdminOrderItemView(
                    item.getId(),
                    item.getProductName(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getSubtotal()
                ))
                .toList();
            }

    private String normalizeLocationNote(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        return trimmed.length() > 255 ? trimmed.substring(0, 255) : trimmed;
    }

    private boolean equalsNullable(String left, String right) {
        if (left == null && right == null) {
            return true;
        }
        if (left == null || right == null) {
            return false;
        }
        return left.equals(right);
    }

    private BigDecimal calculateTotal(List<CartItemEntity> cartItems) {
        BigDecimal total = BigDecimal.ZERO;
        for (CartItemEntity cartItem : cartItems) {
            total = total.add(cartItem.getProduct().getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }
        return total;
    }

    public record CaptureResult(String message, Long orderId) {
    }
}
