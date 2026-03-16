
package main

import (
	"gamevault/controllers"
	"gamevault/database"
	"gamevault/middleware"
	"gamevault/services"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	// Ensure uploads directory exists
	if _, err := os.Stat("uploads"); os.IsNotExist(err) {
		os.Mkdir("uploads", 0755)
	}

	database.Connect()

	services.StartCleanupTask()

	r := gin.Default()

	// CORS Configuration
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	// Public Routes
	api := r.Group("/api")
	{
		api.POST("/auth/signin", controllers.SignIn)
		api.POST("/auth/signup", controllers.SignUp)
		api.POST("/auth/forgot-password", controllers.ForgotPassword)
		api.POST("/auth/reset-password", controllers.ResetPassword)

		api.GET("/games", controllers.GetGames)
		api.GET("/games/:id", controllers.GetGameById)
		api.GET("/categories", controllers.GetAllCategories)
		api.GET("/settings/:key", controllers.GetSetting)
		api.POST("/orders", controllers.CreateOrder) // Allow guests

		// Static files for images - serves from ./uploads folder
		r.Static("/api/images", "./uploads")
		api.POST("/images/upload", controllers.UploadImage)
	}

	// Protected Routes
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		// User Routes
		protected.GET("/orders/user/:userId", controllers.GetUserOrders)
		protected.PUT("/users/:id/profile", controllers.UpdateUserProfile)

		// Admin Routes
		admin := protected.Group("/")
		admin.Use(middleware.AdminMiddleware())
		{
			admin.POST("/games", controllers.CreateGame)
			admin.PUT("/games/:id", controllers.UpdateGame)
			admin.DELETE("/games/:id", controllers.DeleteGame)

			admin.POST("/categories", controllers.CreateCategory)
			admin.PUT("/categories/:id", controllers.UpdateCategory)
			admin.PUT("/categories/types/:oldType", controllers.RenameCategoryType)
			admin.DELETE("/categories/:id", controllers.DeleteCategory)

			admin.GET("/users", controllers.GetUsers)
			admin.PUT("/users/:id", controllers.UpdateUserStatus)

			admin.GET("/orders", controllers.GetAllOrders)
			admin.PUT("/orders/:id/status", controllers.UpdateOrderStatus)

			admin.GET("/audit", controllers.GetAuditLogs)

			admin.POST("/settings/:key", controllers.SaveSetting)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(r.Run(":" + port))
}
