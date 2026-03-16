package models

import (
	"time"

	"github.com/lib/pq"
)

type Role string

const (
	RoleUser  Role = "USER"
	RoleAdmin Role = "ADMIN"
)

type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Username string `gorm:"unique;not null" json:"username"`
	Password string `json:"-"`
	Email    string `json:"email"`
	Phone    string `json:"phone"` 
	Role     Role   `gorm:"type:varchar(20);default:'USER'" json:"role"`
	Enabled  bool   `gorm:"default:true" json:"enabled"`
}

type Category struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Type      string `json:"type"` // GENRE, PLATFORM
	Name      string `json:"name"`
	IsVisible bool   `json:"isVisible"`
}

type Game struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	Price       float64        `json:"price"`
	Quantity    int            `json:"quantity"`
	Images      pq.StringArray `gorm:"type:text[]" json:"images"` // Use text array for URLs
	Categories  []Category     `gorm:"many2many:game_categories;" json:"categories"`
	IsArchived  bool           `json:"isArchived" gorm:"default:false"`
}

type OrderStatus string

const (
	Ordered    OrderStatus = "ORDERED"
	Processing OrderStatus = "PROCESSING"
	Received   OrderStatus = "RECEIVED"
)

type Order struct {
	ID          uint        `gorm:"primaryKey" json:"id"`
	UserID      *uint       `json:"userId"`
	UserDetails *User       `gorm:"foreignKey:UserID" json:"userDetails"`
	GuestName   string      `json:"guestName"`
	GuestEmail  string      `json:"guestEmail"`
	GuestPhone  string      `json:"guestPhone"`
	Note        string      `gorm:"type:text" json:"note"`
	TotalAmount float64     `json:"totalAmount"`
	Status      OrderStatus `gorm:"type:varchar(20)" json:"status"`
	Date        time.Time   `json:"date"`
	Items       []OrderItem `gorm:"foreignKey:OrderID" json:"items"`
}

type OrderItem struct {
	ID              uint    `gorm:"primaryKey" json:"id"`
	OrderID         uint    `json:"-"`
	GameID          uint    `json:"gameId"`
	GameTitle       string  `json:"gameTitle"`
	Quantity        int     `json:"quantity"`
	PriceAtPurchase float64 `json:"priceAtPurchase"`
	ImageURL        string  `json:"imageUrl" gorm:"type:text"` // Explicitly use TEXT for images
}

type AuditLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Username  string    `json:"username"`
	Action    string    `json:"action"`
	Details   string    `json:"details" gorm:"type:text"`
	EntityID  string    `json:"entityId"`
}

type Setting struct {
	Key   string `gorm:"primaryKey;column:setting_key" json:"key"`
	Value string `gorm:"type:text;column:setting_value" json:"value"`
}

type PasswordResetToken struct {
	ID         uint      `gorm:"primaryKey"`
	Token      string    `gorm:"unique"`
	UserID     uint      `json:"userId"`
	User       User      `gorm:"foreignKey:UserID"`
	ExpiryDate time.Time `json:"expiryDate"`
}