package controllers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
	"path/filepath"
)

func UploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := uuid.New().String() + ext
	path := "uploads/" + filename

	if err := c.SaveUploadedFile(file, path); err != nil {
		fmt.Println("Error saving file:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save file"})
		return
	}

	// Return relative path. The frontend will handle prepending the host.
	url := fmt.Sprintf("/api/images/%s", filename)
	
	c.JSON(http.StatusOK, gin.H{"url": url})
}