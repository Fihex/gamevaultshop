
package controllers

import (
	"gamevault/database"
	"gamevault/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func LogAudit(user, action, details, entityId string) {
	log := models.AuditLog{
		Timestamp: time.Now(),
		Username:  user,
		Action:    action,
		Details:   details,
		EntityID:  entityId,
	}
	database.DB.Create(&log)
}

func GetUsername(c *gin.Context) string {
	if u, exists := c.Get("username"); exists {
		return u.(string)
	}
	return "SYSTEM"
}

func GetAuditLogs(c *gin.Context) {
	var logs []models.AuditLog
	var total int64
	db := database.DB.Model(&models.AuditLog{})

	if search := c.Query("search"); search != "" {
		db = db.Where("LOWER(action) LIKE ? OR LOWER(details) LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	db.Count(&total)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	
	db.Order("timestamp desc").Offset(page*size).Limit(size).Find(&logs)
	
	totalPages := int((total + int64(size) - 1) / int64(size))
	c.JSON(http.StatusOK, gin.H{
		"content": logs, 
		"totalElements": total,
		"totalPages": totalPages,
		"last": page >= totalPages-1,
	})
}
