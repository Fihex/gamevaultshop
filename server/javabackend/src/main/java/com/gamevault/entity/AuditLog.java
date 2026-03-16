package com.gamevault.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    private String username;

    private String action;

    @Column(columnDefinition = "TEXT")
    private String details;

    private String entityId;

    public AuditLog(String username, String action, String details, String entityId) {
        this.timestamp = LocalDateTime.now();
        this.username = username;
        this.action = action;
        this.details = details;
        this.entityId = entityId;
    }
}