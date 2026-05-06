package com.locksmith.platform.config;

import com.locksmith.platform.model.Product;
import com.locksmith.platform.model.User;
import com.locksmith.platform.repository.ProductRepository;
import com.locksmith.platform.repository.UserRepository;
import java.math.BigDecimal;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class SeedDataConfig {

    @Bean
    CommandLineRunner seedDatabase(UserRepository userRepository, ProductRepository productRepository) {
        return args -> {
            if (userRepository.findByEmailIgnoreCase("admin@securekey.local").isEmpty()) {
                User admin = new User();
                admin.setName("Platform Admin");
                admin.setEmail("admin@securekey.local");
                admin.setPasswordHash(new BCryptPasswordEncoder(10).encode("Admin@123"));
                admin.setRole(User.Role.admin);
                admin.setVerified(true);
                userRepository.save(admin);
            }

            if (userRepository.findByEmailIgnoreCase("mathe239@gmail.com").isEmpty()) {
                User customer = new User();
                customer.setName("Mathias");
                customer.setEmail("mathe239@gmail.com");
                customer.setPasswordHash(new BCryptPasswordEncoder(10).encode("Customer@123"));
                customer.setRole(User.Role.client);
                customer.setVerified(true);
                userRepository.save(customer);
            }

            if (productRepository.count() == 0) {
                Product first = new Product();
                first.setName("Smart Door Lock Pro");
                first.setDescription("Fingerprint + app-enabled smart lock.");
                first.setPrice(new BigDecimal("149.00"));
                first.setStock(25);
                first.setImageUrl("https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1200");
                first.setActive(true);
                productRepository.save(first);

                Product second = new Product();
                second.setName("Heavy Duty Padlock");
                second.setDescription("Weather-resistant steel body padlock.");
                second.setPrice(new BigDecimal("29.99"));
                second.setStock(60);
                second.setImageUrl("https://images.unsplash.com/photo-1614852206730-0f7d5f3ca9aa?w=1200");
                second.setActive(true);
                productRepository.save(second);

                Product third = new Product();
                third.setName("Transponder Key Blank");
                third.setDescription("Programmable transponder key for modern vehicles.");
                third.setPrice(new BigDecimal("45.00"));
                third.setStock(40);
                third.setImageUrl("https://images.unsplash.com/photo-1616587226157-48e49175ee20?w=1200");
                third.setActive(true);
                productRepository.save(third);
            }
        };
    }
}