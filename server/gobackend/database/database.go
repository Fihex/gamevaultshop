
package database

import (
	"fmt"
	"gamevault/models"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := fmt.Sprintf("host=localhost user=%s password=%s dbname=%s port=5432 sslmode=disable",
		os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected!")
	DB.AutoMigrate(&models.User{}, &models.Category{}, &models.Game{}, &models.Order{}, &models.OrderItem{}, &models.AuditLog{}, &models.Setting{}, &models.PasswordResetToken{})
}
