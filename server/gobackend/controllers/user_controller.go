
package controllers

import (
	"gamevault/database"
	"gamevault/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func GetUsers(c *gin.Context) {
	var users []models.User
	var total int64
	db := database.DB.Model(&models.User{})

	if search := c.Query("search"); search != "" {
		db = db.Where("LOWER(username) LIKE ? OR LOWER(email) LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	db.Count(&total)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	offset := page * size

	db.Order("id desc").Offset(offset).Limit(size).Find(&users)
	totalPages := int((total + int64(size) - 1) / int64(size))

	c.JSON(http.StatusOK, gin.H{
		"content":       users,
		"totalElements": total,
		"totalPages":    totalPages,
		"last":          page >= totalPages-1,
	})
}

func UpdateUserStatus(c *gin.Context) {
	var user models.User
	if err := database.DB.First(&user, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	var updates map[string]interface{}
	c.BindJSON(&updates)

	if role, ok := updates["role"].(string); ok {
		user.Role = models.Role(role)
	}
	if enabled, ok := updates["enabled"].(bool); ok {
		user.Enabled = enabled
	}
	database.DB.Save(&user)
	c.JSON(http.StatusOK, user)
}

func UpdateUserProfile(c *gin.Context) {
	var user models.User
	if err := database.DB.First(&user, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}

	var input struct {
		Username    string `json:"username"`
		Email       string `json:"email"`
		Phone       string `json:"phone"`
		NewPassword string `json:"newPassword"`
	}
	c.BindJSON(&input)

	user.Username = input.Username
	user.Email = input.Email
	user.Phone = input.Phone
	
	if input.NewPassword != "" {
		hash, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
		user.Password = string(hash)
	}
	
	database.DB.Save(&user)
	c.JSON(http.StatusOK, user)
}
