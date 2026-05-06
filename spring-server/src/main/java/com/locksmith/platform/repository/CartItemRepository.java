package com.locksmith.platform.repository;

import com.locksmith.platform.entity.CartItemEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItemEntity, Long> {
    List<CartItemEntity> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<CartItemEntity> findByIdAndUserId(Long id, Long userId);

    Optional<CartItemEntity> findByUserIdAndProductId(Long userId, Long productId);

    void deleteByUserIdAndProductId(Long userId, Long productId);
}
