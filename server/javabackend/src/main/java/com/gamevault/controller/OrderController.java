
package com.gamevault.controller;

import com.gamevault.entity.Order;
import com.gamevault.entity.OrderStatus;
import com.gamevault.entity.Setting;
import com.gamevault.repository.OrderRepository;
import com.gamevault.repository.SettingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private SettingRepository settingRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<Order> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrderStatus status) {
        
        // Sort by Date Descending
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "date"));

        if (search != null && !search.isEmpty()) {
            if (status != null) {
                return orderRepository.searchOrdersByStatus(search, status, pageable);
            }
            return orderRepository.searchOrders(search, pageable);
        }
        
        if (status != null) {
            return orderRepository.findByStatus(status, pageable);
        }

        return orderRepository.findAll(pageable);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("@securityService.isUser(#userId) or hasRole('ADMIN')")
    public Page<Order> getUserOrders(@PathVariable Long userId,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "10") int size) {
        // Sort by Date Descending
        return orderRepository.findByUserId(userId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "date")));
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order) {
        try {
            // Check guest checkout policy
            if (order.getUserId() == null) {
                Setting guestSetting = settingRepository.findByKey("ENABLE_GUEST_CHECKOUT").orElse(null);
                if (guestSetting != null && "false".equalsIgnoreCase(guestSetting.getValue())) {
                    return ResponseEntity.badRequest().body("{\"error\": \"Guest checkout is currently disabled. Please log in.\"}");
                }
            }

            order.setDate(LocalDateTime.now());
            order.setStatus(OrderStatus.ORDERED);
            Order saved = orderRepository.save(order);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error creating order", e);
            return ResponseEntity.internalServerError().body("Error creating order");
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody String status) {
        try {
            return orderRepository.findById(id).map(order -> {
                // Clean up the status string (remove quotes if JSON sent as string)
                String cleanStatus = status.replaceAll("^\"|\"$", "").trim();
                order.setStatus(OrderStatus.valueOf(cleanStatus));
                return ResponseEntity.ok(orderRepository.save(order));
            }).orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status value");
        } catch (Exception e) {
            logger.error("Error updating order status " + id, e);
            return ResponseEntity.internalServerError().body("Error updating status");
        }
    }
}
