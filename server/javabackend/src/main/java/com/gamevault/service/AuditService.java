
package com.gamevault.service;

import com.gamevault.entity.AuditLog;
import com.gamevault.repository.AuditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    @Autowired
    private AuditRepository auditRepository;

    public void log(String action, String details, String entityId) {
        String username = "SYSTEM";
        try {
            username = SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            // Fallback if no auth context
        }
        
        AuditLog log = new AuditLog(username, action, details, entityId);
        auditRepository.save(log);
    }
}