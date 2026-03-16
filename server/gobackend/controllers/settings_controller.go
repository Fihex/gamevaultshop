
package controllers

import (
	"gamevault/database"
	"gamevault/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetSetting(c *gin.Context) {
	var setting models.Setting
	key := c.Param("key")
	// Use model struct for querying to map to correct column names
	if err := database.DB.Where(&models.Setting{Key: key}).First(&setting).Error; err != nil {
		c.JSON(http.StatusOK, models.Setting{Key: key, Value: ""})
		return
	}
	c.JSON(http.StatusOK, setting)
}

func SaveSetting(c *gin.Context) {
	key := c.Param("key")
	var input struct {
		Value string `json:"value"`
	}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid body"})
		return
	}
	
	var setting models.Setting
	
	// Robust Upsert: Check existence by Primary Key first
	// This avoids "duplicate key value" errors on Postgres if Save is treated as Insert
	if err := database.DB.Where("setting_key = ?", key).First(&setting).Error; err != nil {
		// Not found -> Create new
		setting = models.Setting{Key: key, Value: input.Value}
		if createErr := database.DB.Create(&setting).Error; createErr != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save setting"})
            return
		}
	} else {
		// Found -> Update value
		setting.Value = input.Value
		database.DB.Save(&setting)
	}

	c.JSON(http.StatusOK, setting)
}
