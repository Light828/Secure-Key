package com.locksmith.platform.controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.locksmith.platform.model.Product;
import com.locksmith.platform.model.User;
import com.locksmith.platform.repository.ProductRepository;
import com.locksmith.platform.repository.UserRepository;
import com.locksmith.platform.service.JwtService;
import com.locksmith.platform.service.OrderService;

import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final Path UPLOADS_DIR = Paths.get("uploads").toAbsolutePath().normalize();

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final JwtService jwtService;

    public AdminController(ProductRepository productRepository, UserRepository userRepository, OrderService orderService, JwtService jwtService) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderService = orderService;
        this.jwtService = jwtService;
    }

    @GetMapping("/products")
    public Map<String, List<Map<String, Object>>> getProducts(@RequestHeader("Authorization") String authorization) {
        jwtService.requireAdmin(authorization);
        List<Map<String, Object>> products = productRepository.findAll().stream().map(this::toProductMap).collect(Collectors.toList());
        return Map.of("products", products);
    }

    @PostMapping("/products")
    public ResponseEntity<Map<String, Object>> createProduct(@RequestHeader("Authorization") String authorization, @RequestBody ProductRequest request) {
        jwtService.requireAdmin(authorization);
        Product product = new Product();
        applyProductRequest(product, request);
        product = productRepository.save(product);
        return ResponseEntity.ok(Map.of("id", product.getId()));
    }

    @PatchMapping("/products/{id}")
    public Map<String, String> updateProduct(@RequestHeader("Authorization") String authorization, @PathVariable Long id, @RequestBody ProductRequest request) {
        jwtService.requireAdmin(authorization);
        Product product = productRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Product not found"));
        applyProductRequest(product, request);
        productRepository.save(product);
        return Map.of("message", "Product updated");
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/products/{id}")
    public Map<String, String> deleteProduct(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        jwtService.requireAdmin(authorization);
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        productRepository.deleteById(id);
        return Map.of("message", "Product deleted");
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadImage(@RequestHeader("Authorization") String authorization, @RequestParam("image") MultipartFile image) {
        jwtService.requireAdmin(authorization);

        if (image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }

        String contentType = image.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }

        try {
            Files.createDirectories(UPLOADS_DIR);
            String originalName = image.getOriginalFilename() == null ? "image" : image.getOriginalFilename();
            String safeName = originalName.replaceAll("[^a-zA-Z0-9.\\-_]", "-");
            String filename = UUID.randomUUID() + "-" + safeName;
            Path target = UPLOADS_DIR.resolve(filename).normalize();
            image.transferTo(target);
            return Map.of("imageUrl", "/uploads/" + filename);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save image", ex);
        }
    }

    @GetMapping("/orders")
    public Map<String, List<?>> getOrders(@RequestHeader("Authorization") String authorization) {
        return Map.of("orders", orderService.getAdminOrders(authorization));
    }

    @GetMapping("/users")
    public Map<String, List<Map<String, Object>>> getUsers(@RequestHeader("Authorization") String authorization) {
        jwtService.requireAdmin(authorization);
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(this::toUserMap)
                .collect(Collectors.toList());
        return Map.of("users", users);
    }

    @PatchMapping("/users/{id}")
    public Map<String, String> updateUser(@RequestHeader("Authorization") String authorization, @PathVariable Long id, @RequestBody UserUpdateRequest request) {
        jwtService.requireAdmin(authorization);
        User user = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name().trim());
        }
        if (request.role() != null) {
            user.setRole(request.role());
        }

        userRepository.save(user);
        return Map.of("message", "User updated");
    }

    @PatchMapping("/orders/{id}/status")
    public Map<String, String> updateOrderStatus(@RequestHeader("Authorization") String authorization, @PathVariable Long id, @RequestBody OrderStatusRequest request) {
        orderService.updateProcessingStatus(authorization, id, request.processingStatus(), request.locationNote());
        return Map.of("message", "Order status updated");
    }

    private void applyProductRequest(Product product, ProductRequest request) {
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setImageUrl(request.imageUrl());
        product.setActive(request.isActive());
    }

    private Map<String, Object> toProductMap(Product product) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", product.getId());
        item.put("name", product.getName());
        item.put("description", product.getDescription());
        item.put("price", product.getPrice());
        item.put("stock", product.getStock());
        item.put("image_url", product.getImageUrl());
        item.put("is_active", product.isActive() ? 1 : 0);
        return item;
    }

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", user.getId());
        item.put("name", user.getName());
        item.put("email", user.getEmail());
        item.put("role", user.getRole() == null ? User.Role.client.name() : user.getRole().name());
        item.put("verified", user.isVerified());
        item.put("createdAt", user.getCreatedAt() == null ? null : user.getCreatedAt().toString());
        item.put("enabled", true);
        return item;
    }

    public record ProductRequest(@NotBlank String name, String description, BigDecimal price, Integer stock, String imageUrl, boolean isActive) {

    }

    public record OrderStatusRequest(@NotBlank String processingStatus, String locationNote) {

    }

    public record UserUpdateRequest(String name, com.locksmith.platform.model.User.Role role, Boolean disabled) {

    }
}
