package com.locksmith.platform.repository;

import com.locksmith.platform.entity.OrderLocationHistoryEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderLocationHistoryRepository extends JpaRepository<OrderLocationHistoryEntity, Long> {
    List<OrderLocationHistoryEntity> findByOrderIdOrderByCreatedAtDesc(Long orderId);
}
