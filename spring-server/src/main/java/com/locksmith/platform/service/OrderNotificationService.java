package com.locksmith.platform.service;

import com.locksmith.platform.entity.OrderEntity;
import com.locksmith.platform.entity.OrderItemEntity;
import com.locksmith.platform.repository.OrderItemRepository;
import com.locksmith.platform.repository.OrderRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
public class OrderNotificationService {

    private static final Logger log = LoggerFactory.getLogger(OrderNotificationService.class);

    private final JavaMailSender mailSender;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.notification-from:no-reply@securekey.local}")
    private String fromAddress;

    public OrderNotificationService(JavaMailSender mailSender, OrderRepository orderRepository, OrderItemRepository orderItemRepository) {
        this.mailSender = mailSender;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderStatusChanged(OrderStatusChangedEvent event) {
        OrderEntity order = orderRepository.findById(event.orderId()).orElse(null);
        if (order == null) {
            log.warn("Skipping order notification for missing order {}", event.orderId());
            return;
        }

        sendOrderStatusEmail(order, event.previousStatus(), event.nextStatus());
    }

    private void sendOrderStatusEmail(OrderEntity order, String previousStatus, String nextStatus) {
        if (!isMailConfigured()) {
            log.info(
                    "[ORDER_STATUS_EMAIL_FALLBACK] Order {} status changed from {} to {} for {} <{}>",
                    order.getId(),
                    previousStatus,
                    nextStatus,
                    order.getUser().getName(),
                    order.getUser().getEmail()
            );
            return;
        }

        List<OrderItemEntity> items = orderItemRepository.findByOrderId(order.getId());
        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(order.getUser().getEmail());
            helper.setSubject("Your SecureKey order #" + order.getId() + " is now " + formatStatus(nextStatus));
            helper.setText(buildEmailBody(order, items, previousStatus, nextStatus), true);
            mailSender.send(message);
        } catch (MessagingException ex) {
            throw new IllegalStateException("Failed to prepare order status email", ex);
        }
    }

    private boolean isMailConfigured() {
        return hasText(mailHost) && hasText(mailUsername) && hasText(mailPassword);
    }

    private String buildEmailBody(OrderEntity order, List<OrderItemEntity> items, String previousStatus, String nextStatus) {
        StringBuilder builder = new StringBuilder();
        builder.append("<div style='font-family:Arial,sans-serif;line-height:1.6;color:#111827'>");
        builder.append("<h2 style='margin:0 0 12px 0;'>Hello ").append(escape(order.getUser().getName())).append(",</h2>");
        builder.append("<p>Your order <strong>#").append(order.getId()).append("</strong> has been updated.</p>");
        builder.append("<p>Status changed from <strong>").append(formatStatus(previousStatus)).append("</strong> to <strong>").append(formatStatus(nextStatus)).append("</strong>.</p>");
        builder.append("<p><strong>Payment:</strong> ").append(formatStatus(order.getPaymentStatus().name())).append("<br/>");
        builder.append("<strong>Total:</strong> $").append(order.getTotal().setScale(2, BigDecimal.ROUND_HALF_UP)).append("<br/>");
        builder.append("<strong>Tracking:</strong> Log in and open your Cart & Checkout page to view the latest order status.</p>");

        if (!items.isEmpty()) {
            builder.append("<h3 style='margin:24px 0 8px 0;'>Order items</h3><ul>");
            for (OrderItemEntity item : items) {
                builder.append("<li>")
                        .append(escape(item.getProductName()))
                        .append(" x ")
                        .append(item.getQuantity())
                        .append("</li>");
            }
            builder.append("</ul>");
        }

        builder.append("<p style='margin-top:24px;'>If you have any questions, reply to this email and our team will help.</p>");
        builder.append("</div>");
        return builder.toString();
    }

    private String formatStatus(String status) {
        if (status == null || status.isBlank()) {
            return "Unknown";
        }

        return switch (status.toLowerCase()) {
            case "awaiting_payment" -> "Awaiting payment";
            case "new" -> "New order";
            case "processing" -> "Processing";
            case "completed" -> "Completed";
            case "cancelled" -> "Cancelled";
            case "pending" -> "Pending";
            case "paid" -> "Paid";
            case "failed" -> "Failed";
            default -> status;
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
