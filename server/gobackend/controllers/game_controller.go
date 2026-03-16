
package controllers

import (
	"fmt" // Add this
	"gamevault/database"
	"gamevault/models"
	"net/http"
	"net/url" // Add this
	"os"
	"path/filepath" // Add this
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func GetGames(c *gin.Context) {
	var games []models.Game
	var total int64

	db := database.DB.Model(&models.Game{}).Preload("Categories")

	// Filtering
	if search := c.Query("search"); search != "" {
		// Try to convert the search string to an integer
		if id, err := strconv.Atoi(search); err == nil {
			// If it's a number, search by Title (partial) OR ID (exact)
			db = db.Where("LOWER(title) LIKE LOWER(?) OR id = ?", "%"+search+"%", id)
		} else {
			// If it's not a number, just search by Title (partial)
			db = db.Where("LOWER(title) LIKE LOWER(?)", "%"+search+"%")
		}
	}

	// Parse Price Filters
	if minPriceStr := c.Query("minPrice"); minPriceStr != "" {
		if val, err := strconv.ParseFloat(minPriceStr, 64); err == nil {
			db = db.Where("price >= ?", val)
		}
	}
	if maxPriceStr := c.Query("maxPrice"); maxPriceStr != "" {
		if val, err := strconv.ParseFloat(maxPriceStr, 64); err == nil {
			db = db.Where("price <= ?", val)
		}
	}
	// Parse Stock Filters
	if minStockStr := c.Query("minStock"); minStockStr != "" {
		if val, err := strconv.Atoi(minStockStr); err == nil {
			db = db.Where("quantity >= ?", val)
		}
	}
	if maxStockStr := c.Query("maxStock"); maxStockStr != "" {
		if val, err := strconv.Atoi(maxStockStr); err == nil {
			db = db.Where("quantity <= ?", val)
		}
	}

	// Archive Filter
	if archived := c.Query("archived"); archived != "" {
		isArchived := archived == "true"
		db = db.Where("is_archived = ?", isArchived)
	}

	// Grouped AND Filtering for Categories
	if catsStr, ok := c.GetQueryArray("categories"); ok && len(catsStr) > 0 {
		var selectedCats []models.Category
		database.DB.Where("id IN ?", catsStr).Find(&selectedCats)

		grouped := make(map[string][]uint)
		for _, cat := range selectedCats {
			grouped[cat.Type] = append(grouped[cat.Type], cat.ID)
		}

		for _, ids := range grouped {
			subQuery := database.DB.Table("game_categories").Select("game_id").Where("category_id IN ?", ids)
			db = db.Where("id IN (?)", subQuery)
		}
	}

	if availability := c.Query("availability"); availability != "" {
		if availability == "IN_STOCK" {
			db = db.Where("quantity > 0")
		} else if availability == "OUT_OF_STOCK" {
			db = db.Where("quantity = 0")
		}
	}

	db.Count(&total)

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	offset := page * size

	// Sorting
	sortBy := c.DefaultQuery("sortBy", "id")
	sortDir := c.DefaultQuery("sortDir", "desc")

	orderClause := "id desc"
	if sortBy == "price" || sortBy == "title" || sortBy == "id" {
		if sortDir == "asc" || sortDir == "desc" {
			orderClause = sortBy + " " + sortDir
		}
	}

	db.Order(orderClause).Offset(offset).Limit(size).Find(&games)

	totalPages := int((total + int64(size) - 1) / int64(size))

	c.JSON(http.StatusOK, gin.H{
		"content":       games,
		"totalElements": total,
		"totalPages":    totalPages,
		"last":          page >= totalPages-1,
	})
}

func GetGameById(c *gin.Context) {
	var game models.Game
	if err := database.DB.Preload("Categories").First(&game, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Game not found"})
		return
	}
	c.JSON(http.StatusOK, game)
}

func CreateGame(c *gin.Context) {
	var game models.Game
	if err := c.BindJSON(&game); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&game)
	LogAudit(GetUsername(c), "CREATE_GAME", "Created game: "+game.Title, strconv.Itoa(int(game.ID)))
	c.JSON(http.StatusOK, game)
}

func UpdateGame(c *gin.Context) {
	// 1. Find the existing game in the Database
	var game models.Game
	if err := database.DB.First(&game, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Game not found"})
		return
	}

	// 2. Capture the OLD images before binding new data
	// We make a copy to ensure we don't lose the reference
	oldImages := make([]string, len(game.Images))
	copy(oldImages, game.Images)

	// 3. Bind the NEW data from the request
	var input models.Game
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 4. IMAGE DELETION LOGIC (Must happen BEFORE updating game.Images)
	fmt.Println("--- Starting Image Cleanup ---")
	for _, oldImg := range oldImages {
		found := false
		for _, newImg := range input.Images {
			if oldImg == newImg {
				found = true
				break
			}
		}

		// If the old image is NOT in the new list, delete it from disk
		if !found {
			// Check if it's a local file (contains /api/images/)
			if strings.Contains(oldImg, "/api/images/") {
				// Parse URL to handle special characters or relative paths safely
				parsedUrl, err := url.Parse(oldImg)
				if err == nil {
					// Extract just the filename (e.g., "uuid-123.jpg")
					fileName := filepath.Base(parsedUrl.Path)

					// Construct the OS-specific path (e.g., "uploads/uuid-123.jpg")
					// Assumes your "uploads" folder is in the root where the app runs
					filePath := filepath.Join("uploads", fileName)

					fmt.Printf("Deleting orphaned file: %s\n", filePath)

					err := os.Remove(filePath)
					if err != nil {
						fmt.Printf("ERROR deleting file: %v\n", err)
					} else {
						fmt.Println("File deleted successfully.")
					}
				}
			}
		}
	}
	fmt.Println("--- Cleanup Finished ---")

	// 5. Now it is safe to update the Game struct fields
	game.Title = input.Title
	game.Description = input.Description
	game.Price = input.Price
	game.Quantity = input.Quantity
	game.Images = input.Images // <--- This overwrites the old list
	game.IsArchived = input.IsArchived

	// Clear old categories and replace
	database.DB.Model(&game).Association("Categories").Replace(input.Categories)

	database.DB.Save(&game)
	LogAudit(GetUsername(c), "UPDATE_GAME", "Updated game: "+game.Title, strconv.Itoa(int(game.ID)))
	c.JSON(http.StatusOK, game)
}

func DeleteGame(c *gin.Context) {
	var game models.Game
	id := c.Param("id")
	if err := database.DB.First(&game, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	// Delete associated image files from disk if they are local
	for _, imgUrl := range game.Images {
		// Only delete if it looks like a local file we uploaded
		if strings.Contains(imgUrl, "/api/images/") {
			parts := strings.Split(imgUrl, "/")
			if len(parts) > 0 {
				filename := parts[len(parts)-1]
				// We assume images are stored in the "uploads" folder in root
				err := os.Remove("uploads/" + filename)
				if err != nil {
					// Log error but continue deletion
				}
			}
		}
	}

	// Clear associations in the join table first to avoid constraint violations
	database.DB.Model(&game).Association("Categories").Clear()

	// Now delete the game
	database.DB.Delete(&game)

	LogAudit(GetUsername(c), "DELETE_GAME", "Deleted game: "+game.Title, id)
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
