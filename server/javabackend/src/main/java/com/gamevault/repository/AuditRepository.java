
package com.gamevault.repository;

import com.gamevault.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByUsernameContainingIgnoreCaseOrActionContainingIgnoreCaseOrDetailsContainingIgnoreCase(String user, String action, String details, Pageable pageable);
}