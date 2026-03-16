package com.gamevault.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long gameId;
    private String gameTitle;
    private Integer quantity;
    private Double priceAtPurchase;
    
    @Column(columnDefinition = "TEXT")
    private String imageUrl;
}