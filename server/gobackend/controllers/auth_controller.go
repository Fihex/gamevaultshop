
package controllers

import (
	"gamevault/database"
	"gamevault/models"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func SignIn(c *gin.Context) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("username = ?", input.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !user.Enabled {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account disabled"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS512, jwt.MapClaims{
		"sub":  user.Username,
		"role": user.Role,
		"exp":  time.Now().Add(time.Hour * 168).Unix(),
	})

	tokenString, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

	LogAudit("SYSTEM", "LOGIN", "User logged in", user.Username)

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user":  user,
	})
}

func SignUp(c *gin.Context) {
	// Check if registration is enabled
	var setting models.Setting
	if err := database.DB.Where("setting_key = ?", "ENABLE_REGISTRATION").First(&setting).Error; err == nil {
		if setting.Value == "false" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Registration is currently disabled by the administrator."})
			return
		}
	}

	var input struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	user := models.User{Username: input.Username, Email: input.Email, Password: string(hashedPassword)}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username or Email already taken"})
		return
	}

	LogAudit("SYSTEM", "REGISTER", "New user registered", user.Username)
	c.JSON(http.StatusOK, gin.H{"message": "Registered successfully"})
}

func ForgotPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email"`
	}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		// Don't reveal user existence
		c.JSON(http.StatusOK, gin.H{"message": "If email exists, reset link sent"})
		return
	}

	token := uuid.New().String()
	resetToken := models.PasswordResetToken{
		Token:      token,
		UserID:     user.ID,
		ExpiryDate: time.Now().Add(1 * time.Hour),
	}
	database.DB.Create(&resetToken)

	// Mock Email Sending
	println("RESET TOKEN FOR " + user.Email + ": " + token)

	c.JSON(http.StatusOK, gin.H{"message": "Reset link sent"})
}

func ResetPassword(c *gin.Context) {
	var input struct {
		Token       string `json:"token"`
		NewPassword string `json:"newPassword"`
	}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var resetToken models.PasswordResetToken
	if err := database.DB.Where("token = ?", input.Token).First(&resetToken).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
		return
	}

	if time.Now().After(resetToken.ExpiryDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token expired"})
		return
	}

	var user models.User
	database.DB.First(&user, resetToken.UserID)
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	user.Password = string(hashedPassword)
	database.DB.Save(&user)
	database.DB.Delete(&resetToken)

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successful"})
}
