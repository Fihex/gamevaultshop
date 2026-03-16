package services

import (
	"fmt"
	"gamevault/database"
	"gamevault/models"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// StartCleanupTask initializes the background job
func StartCleanupTask() {
	// 1. CHECK THE TOGGLE SWITCH
	envVal := os.Getenv("APP_IMAGES_CLEANUP_ENABLED")

	// Default to FALSE (Off)
	isEnabled := false

	// Only set to true if the environment variable explicitly says "true" or "1"
	if envVal != "" {
		if val, err := strconv.ParseBool(envVal); err == nil {
			isEnabled = val
		}
	}

	if !isEnabled {
		fmt.Println("--- [CRON] Orphaned File Cleanup is DISABLED (Default). To enable, set CLEANUP_ENABLED=true ---")
		return // Exit function, do not start the background routine
	}

	fmt.Println("--- [CRON] Orphaned File Cleanup Service Started. Scheduled for 03:00 AM daily. ---")

	// Run in background
	go func() {
		// 1. RUN IMMEDIATELY ON SERVER START
        cleanOrphanedFiles()
		// ---------------------------------------------------------
		// SCHEDULE LOGIC: Run at specific wall-clock time (3:00 AM)
		// ---------------------------------------------------------
		now := time.Now()

		// Calculate next 3:00:00 AM
		// Change the '3, 0, 0' below to change the Hour, Minute, Second
		nextRun := time.Date(now.Year(), now.Month(), now.Day(), 3, 0, 0, 0, now.Location())

		// If 3:00 AM has already passed today, schedule for tomorrow
		if nextRun.Before(now) {
			nextRun = nextRun.Add(24 * time.Hour)
		}

		fmt.Printf("--- [CRON] Next cleanup run scheduled for: %v ---\n", nextRun.Format(time.RFC1123))

		// Sleep until the scheduled time
		time.Sleep(time.Until(nextRun))

		// ---------------------------------------------------------
		// EXECUTION LOOP
		// ---------------------------------------------------------

		// 1. Run the first cleanup (because we woke up at 3 AM)
		cleanOrphanedFiles()

		// 2. Start a ticker to run exactly every 24 hours from this point
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			cleanOrphanedFiles()
		}
	}()
}

func cleanOrphanedFiles() {
	fmt.Println("--- [CRON] Scanning for orphaned files... ---")

	// 1. Get all games from Database (Select only 'images' column for speed)
	var games []models.Game
	if err := database.DB.Select("images").Find(&games).Error; err != nil {
		fmt.Printf("[CRON] Error fetching games: %v\n", err)
		return
	}

	// 2. Create a lookup map of all images currently in use
	//    Map Key = filename (e.g. "uuid.jpg")
	validFiles := make(map[string]bool)
	for _, game := range games {
		for _, imgUrl := range game.Images {
			// Database stores: "/api/images/uuid.jpg" -> We need: "uuid.jpg"
			parts := strings.Split(imgUrl, "/")
			if len(parts) > 0 {
				filename := parts[len(parts)-1]
				validFiles[filename] = true
			}
		}
	}

	// 3. Define uploads directory
	// Note: Relies on Systemd WorkingDirectory being set correctly!
	uploadsDir := "uploads"

	files, err := os.ReadDir(uploadsDir)
	if err != nil {
		// Silent fail if folder doesn't exist yet
		return
	}

	deletedCount := 0

	// 4. Scan disk files
	for _, file := range files {
		if file.IsDir() {
			continue
		}

		filename := file.Name()

		// CHECK: Is the file NOT in the database list?
		if _, exists := validFiles[filename]; !exists {

			info, err := file.Info()
			if err != nil {
				continue
			}

			// SAFETY CHECK: Only delete if file is OLDER than 24 hours
			// This prevents deleting files that are currently being uploaded
			if time.Since(info.ModTime()) > 24*time.Hour {

				fullPath := filepath.Join(uploadsDir, filename)

				fmt.Printf("[CRON] Deleting orphan: %s\n", filename)

				err := os.Remove(fullPath)
				if err != nil {
					fmt.Printf("[CRON] Failed to delete: %v\n", err)
				} else {
					deletedCount++
				}
			}
		}
	}

	if deletedCount > 0 {
		fmt.Printf("--- [CRON] Cleanup Finished. Deleted %d files. ---\n", deletedCount)
	} else {
		fmt.Println("--- [CRON] Cleanup Finished. No files needed deletion. ---")
	}
}
