package com.gamevault.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // e.g., PUBLISHER, GENRE, PLATFORM
    private String type;

    private String name;

    @JsonProperty("isVisible")
    private boolean isVisible = true;
}