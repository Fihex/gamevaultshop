package controllers

import (
	"gamevault/database"
	"gamevault/models"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func CreateOrder(c *gin.Context) {
	var order models.Order
	if err := c.BindJSON(&order); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check guest checkout policy if userID is nil/0
	if order.UserID == nil || *order.UserID == 0 {
		var setting models.Setting
		if err := database.DB.Where("setting_key = ?", "ENABLE_GUEST_CHECKOUT").First(&setting).Error; err == nil {
			if setting.Value == "false" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Guest checkout is currently disabled. Please log in."})
				return
			}
		}
	}

	order.Date = time.Now()
	order.Status = models.Ordered
	
	if err := database.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to place order: " + err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, order)
}

func GetAllOrders(c *gin.Context) {
	var orders []models.Order
	var total int64
	db := database.DB.Model(&models.Order{}).Preload("UserDetails").Preload("Items")

	search := c.Query("search")
	status := c.Query("status")

	if search != "" {
		db = db.Joins("LEFT JOIN users ON users.id = orders.user_id").
			Where("CAST(orders.id AS TEXT) LIKE ? OR LOWER(orders.guest_name) LIKE ? OR LOWER(users.username) LIKE ?", 
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if status != "" && status != "ALL" {
		db = db.Where("orders.status = ?", status)
	}

	db.Count(&total)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	offset := page * size

	db.Order("date desc").Offset(offset).Limit(size).Find(&orders)

	totalPages := int((total + int64(size) - 1) / int64(size))

	c.JSON(http.StatusOK, gin.H{
		"content":       orders,
		"totalElements": total,
		"totalPages":    totalPages,
		"last":          page >= totalPages-1,
	})
}

func GetUserOrders(c *gin.Context) {
	userId := c.Param("userId")
	// Verify access
	reqUser := GetUsername(c)
	var user models.User
	database.DB.First(&user, userId)
	
	// Only allow self or admin
	role, _ := c.Get("role")
	if user.Username != reqUser && role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var orders []models.Order
	// Pagination simplified for user view
	database.DB.Where("user_id = ?", userId).Preload("Items").Order("date desc").Find(&orders)
	
	c.JSON(http.StatusOK, gin.H{
		"content":       orders,
		"totalElements": len(orders),
		"totalPages":    1,
		"last":          true,
	})
}

func UpdateOrderStatus(c *gin.Context) {
	var order models.Order
	if err := database.DB.First(&order, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	
	// Read raw body
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}
	
	statusStr := string(bodyBytes)
	// Clean up quotes if JSON string was sent
	statusStr = strings.Trim(statusStr, "\"")
	statusStr = strings.TrimSpace(statusStr)

	order.Status = models.OrderStatus(statusStr)
	if err := database.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}
	c.JSON(http.StatusOK, order)
}