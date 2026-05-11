package com.locksmith.platform.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.locksmith.platform.repository.ProductRepository;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public Map<String, List<Map<String, Object>>> getProducts() {
        List<Map<String, Object>> products = productRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                .map(product -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", product.getId());
                    item.put("name", product.getName());
                    item.put("description", product.getDescription());
                    item.put("price", product.getPrice());
                    item.put("stock", product.getStock());
                    item.put("image_url", product.getImageUrl());
                    item.put("is_active", product.isActive() ? 1 : 0);
                    return item;
                })
                .collect(Collectors.toList());
        return Map.of("products", products);
    }
}
