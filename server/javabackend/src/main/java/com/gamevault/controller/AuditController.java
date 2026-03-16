
package com.gamevault.controller;

import com.gamevault.entity.AuditLog;
import com.gamevault.repository.AuditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    @Autowired
    private AuditRepository auditRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AuditLog> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        
        if (search != null && !search.isEmpty()) {
            return auditRepository.findByUsernameContainingIgnoreCaseOrActionContainingIgnoreCaseOrDetailsContainingIgnoreCase(search, search, search, pageRequest);
        }
        return auditRepository.findAll(pageRequest);
    }
}