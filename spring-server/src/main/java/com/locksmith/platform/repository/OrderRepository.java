package com.locksmith.platform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.locksmith.platform.entity.OrderEntity;
import com.locksmith.platform.model.User;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    List<OrderEntity> findByUserOrderByCreatedAtDesc(User user);

    Optional<OrderEntity> findByPaypalOrderId(String paypalOrderId);

    List<OrderEntity> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(MAX(o.id), 0) FROM OrderEntity o")
    Long findMaxId();
}
