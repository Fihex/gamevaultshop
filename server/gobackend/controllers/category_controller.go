
package controllers

import (
	"gamevault/database"
	"gamevault/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetAllCategories(c *gin.Context) {
	var cats []models.Category
	database.DB.Find(&cats)
	c.JSON(http.StatusOK, cats)
}

func CreateCategory(c *gin.Context) {
	var cat models.Category
	if err := c.BindJSON(&cat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&cat)
	c.JSON(http.StatusOK, cat)
}

func UpdateCategory(c *gin.Context) {
	var cat models.Category
	if err := database.DB.First(&cat, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.BindJSON(&cat)
	database.DB.Save(&cat)
	c.JSON(http.StatusOK, cat)
}

func RenameCategoryType(c *gin.Context) {
	oldType := c.Param("oldType")
	newType := c.Query("newType")

	if newType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "newType required"})
		return
	}

	database.DB.Model(&models.Category{}).Where("type = ?", oldType).Update("type", newType)
	c.Status(http.StatusOK)
}

func DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	
	// Remove association from games first
	database.DB.Exec("DELETE FROM game_categories WHERE category_id = ?", id)
	
	database.DB.Delete(&models.Category{}, id)
	c.Status(http.StatusOK)
}
