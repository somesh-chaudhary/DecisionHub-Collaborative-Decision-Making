package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.Role;
import com.example.backend.entity.User;
public interface UserRepository extends JpaRepository<User, Long> {
	List<User> findByRole(Role role);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    long countByRole(Role role);

    long countByStatus(String status);
}