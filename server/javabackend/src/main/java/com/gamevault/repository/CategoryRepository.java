
package com.gamevault.repository;

import com.gamevault.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByIsVisibleTrue();
    List<Category> findByType(String type);
}
