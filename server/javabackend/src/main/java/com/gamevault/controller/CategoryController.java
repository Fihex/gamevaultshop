
package com.gamevault.controller;

import com.gamevault.entity.Category;
import com.gamevault.entity.Game;
import com.gamevault.repository.CategoryRepository;
import com.gamevault.repository.GameRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private static final Logger logger = LoggerFactory.getLogger(CategoryController.class);

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private GameRepository gameRepository;

    @GetMapping
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        try {
            Category saved = categoryRepository.save(category);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error creating category", e);
            return ResponseEntity.internalServerError().body("Error creating category");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Category details) {
        try {
            return categoryRepository.findById(id).map(c -> {
                c.setName(details.getName());
                c.setType(details.getType());
                c.setVisible(details.isVisible());
                return ResponseEntity.ok(categoryRepository.save(c));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error updating category " + id, e);
            return ResponseEntity.internalServerError().body("Error updating category");
        }
    }
    
    @PutMapping("/types/{oldType}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> updateCategoryType(@PathVariable String oldType, @RequestParam String newType) {
        try {
            List<Category> cats = categoryRepository.findByType(oldType);
            for (Category c : cats) {
                c.setType(newType);
                categoryRepository.save(c);
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error updating category type " + oldType, e);
            return ResponseEntity.internalServerError().body("Error updating category type");
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            // Detach this category from all games first to avoid foreign key constraint violation
            List<Game> games = gameRepository.findAll();
            for (Game game : games) {
                // removeIf returns true if any elements were removed
                if (game.getCategories().removeIf(c -> c.getId().equals(id))) {
                    gameRepository.save(game);
                }
            }
            categoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting category " + id, e);
            return ResponseEntity.internalServerError().body("Error deleting category: " + e.getMessage());
        }
    }
}
