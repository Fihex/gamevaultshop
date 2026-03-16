
package com.gamevault.repository;

import com.gamevault.entity.Order;
import com.gamevault.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT o FROM Order o LEFT JOIN o.userDetails u WHERE " +
           "CAST(o.id AS string) LIKE %:search% OR " +
           "LOWER(o.guestName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(o.guestEmail) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Order> searchOrders(@Param("search") String search, Pageable pageable);

    @Query("SELECT o FROM Order o LEFT JOIN o.userDetails u WHERE " +
           "(CAST(o.id AS string) LIKE %:search% OR " +
           "LOWER(o.guestName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(o.guestEmail) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "o.status = :status")
    Page<Order> searchOrdersByStatus(@Param("search") String search, @Param("status") OrderStatus status, Pageable pageable);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
}
