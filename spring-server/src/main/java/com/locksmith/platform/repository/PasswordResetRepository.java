package com.locksmith.platform.repository;

import com.locksmith.platform.model.PasswordReset;
import com.locksmith.platform.model.User;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {
    Optional<PasswordReset> findByCodeAndUsedAtIsNullAndExpiresAtGreaterThanEqual(String code, Instant now);

    Optional<PasswordReset> findByUserAndUsedAtIsNullOrderByCreatedAtDesc(User user);

    void deleteByExpiresAtBefore(Instant now);
}
