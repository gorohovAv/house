package main

import (
	"html/template"
	"log"
	"net/http"
	"os"
	"sort"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ConstructionResult представляет результат строительства
type ConstructionResult struct {
	ID                    uint      `json:"id" gorm:"primaryKey"`
	Name                  string    `json:"name" gorm:"not null"`
	PlannedDuration       int       `json:"planned_duration"`       // в днях
	PlannedCost           int       `json:"planned_cost"`           
	ActualDuration        int       `json:"actual_duration"`        // в днях
	ActualCost            int       `json:"actual_cost"`            
	CostDifference        int       `json:"cost_difference"`        // разница в стоимости
	DurationDifference    int       `json:"duration_difference"`    // разница в длительности
	CreatedAt             time.Time `json:"created_at"`
}

// CreateResultRequest структура для создания результата
type CreateResultRequest struct {
	Name            string `json:"name" binding:"required"`
	PlannedDuration int    `json:"planned_duration" binding:"required,min=1"`
	PlannedCost     int    `json:"planned_cost" binding:"required,min=0"`
	ActualDuration  int    `json:"actual_duration" binding:"required,min=1"`
	ActualCost      int    `json:"actual_cost" binding:"required,min=0"`
}

var db *gorm.DB

func main() {
	// Получение переменных окружения для подключения к PostgreSQL
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "12345")
	dbname := getEnv("DB_NAME", "houseapp")

	// Строка подключения к PostgreSQL
	dsn := "host=" + host + " user=" + user + " password=" + password + " dbname=" + dbname + " port=" + port + " sslmode=disable TimeZone=UTC"

	// Инициализация базы данных
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Не удалось подключиться к базе данных:", err)
	}

	// Автомиграция
	db.AutoMigrate(&ConstructionResult{})

	// Настройка Gin
	r := gin.Default()

	// Настройка CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://93.183.68.113:8080", "http://93.183.68.113", "http://scheduler-assistant.ru", "https://scheduler-assistant.ru"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API эндпоинты
	api := r.Group("/api")
	{
		api.POST("/results", createResult)
		api.GET("/results", getResults)
	}

	// HTML страница
	r.GET("/", getResultsPage)

	// Запуск сервера
	log.Println("Сервер запущен на http://localhost:8080")
	r.Run(":8080")
}

// createResult создает новый результат строительства
func createResult(c *gin.Context) {
	var req CreateResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Вычисляем разности
	costDiff := req.ActualCost - req.PlannedCost
	durationDiff := req.ActualDuration - req.PlannedDuration

	result := ConstructionResult{
		Name:               req.Name,
		PlannedDuration:    req.PlannedDuration,
		PlannedCost:        req.PlannedCost,
		ActualDuration:     req.ActualDuration,
		ActualCost:         req.ActualCost,
		CostDifference:     costDiff,
		DurationDifference: durationDiff,
		CreatedAt:          time.Now(),
	}

	if err := db.Create(&result).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении результата"})
		return
	}

	c.JSON(http.StatusCreated, result)
}

// getResults возвращает список всех результатов
func getResults(c *gin.Context) {
	var results []ConstructionResult
	if err := db.Find(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении результатов"})
		return
	}

	// Сортировка по разности стоимости (по возрастанию), затем по длительности, затем по времени создания
	sort.Slice(results, func(i, j int) bool {
		if results[i].CostDifference == results[j].CostDifference {
			if results[i].DurationDifference == results[j].DurationDifference {
				return results[i].CreatedAt.Before(results[j].CreatedAt)
			}
			return results[i].DurationDifference < results[j].DurationDifference
		}
		return results[i].CostDifference < results[j].CostDifference
	})

	c.JSON(http.StatusOK, results)
}

// getResultsPage возвращает HTML страницу с результатами
func getResultsPage(c *gin.Context) {
	var results []ConstructionResult
	if err := db.Find(&results).Error; err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"error": "Ошибка при получении результатов",
		})
		return
	}

	// Сортировка по разности стоимости (по возрастанию), затем по длительности, затем по времени создания
	sort.Slice(results, func(i, j int) bool {
		if results[i].CostDifference == results[j].CostDifference {
			if results[i].DurationDifference == results[j].DurationDifference {
				return results[i].CreatedAt.Before(results[j].CreatedAt)
			}
			return results[i].DurationDifference < results[j].DurationDifference
		}
		return results[i].CostDifference < results[j].CostDifference
	})

	// Загружаем шаблон из файла
	tmpl, err := template.New("results.html").Funcs(template.FuncMap{
		"add": func(a, b int) int { return a + b },
		"sub": func(a, b int) int { return a - b },
	}).ParseFiles("templates/results.html")
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"error": "Ошибка при загрузке шаблона",
		})
		return
	}

	c.Header("Content-Type", "text/html; charset=utf-8")
	tmpl.Execute(c.Writer, gin.H{
		"results": results,
	})
}

// getEnv получает переменную окружения или возвращает значение по умолчанию
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
