package com.locksmith.platform.repository;

import com.locksmith.platform.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    @Query("select count(u) from User u where u.role = 'admin'")
    long countAdminUsers();
}
