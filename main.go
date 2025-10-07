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
	ProjectedDuration     int       `json:"projected_duration"`     // прогнозная длительность
	ProjectedCost         int       `json:"projected_cost"`         // прогнозная стоимость
	CostDifference        int       `json:"cost_difference"`        // разница в стоимости (projected - planned)
	DurationDifference    int       `json:"duration_difference"`    // разница в длительности (projected - planned)
	CostRating            int       `json:"cost_rating"`            // оценка по стоимости (1-10)
	DurationRating        int       `json:"duration_rating"`        // оценка по длительности (1-10)
	FinalRating           float64   `json:"final_rating"`           // итоговая оценка
	IsCompleted           bool      `json:"is_completed"`           // достроен ли дом
	CreatedAt             time.Time `json:"created_at"`
}

// CreateResultRequest структура для создания результата
type CreateResultRequest struct {
	Name              string `json:"name" binding:"required"`
	PlannedDuration   int    `json:"planned_duration" binding:"required,min=1"`
	PlannedCost       int    `json:"planned_cost" binding:"required,min=0"`
	ActualDuration    int    `json:"actual_duration" binding:"required,min=1"`
	ActualCost        int    `json:"actual_cost" binding:"required,min=0"`
	ProjectedDuration int    `json:"projected_duration" binding:"required,min=1"`
	ProjectedCost     int    `json:"projected_cost" binding:"required,min=0"`
	IsCompleted       bool   `json:"is_completed"`
}

var db *gorm.DB

// calculateRating рассчитывает оценку от 1 до 10 на основе значения и диапазона
func calculateRating(value, min, max int) int {
	if min == max {
		return 5 // если все значения одинаковые, ставим среднюю оценку
	}
	
	// Нормализуем значение в диапазон 0-1
	normalized := float64(value-min) / float64(max-min)
	
	// Преобразуем в оценку 1-10 (чем меньше разница, тем выше оценка)
	rating := 10 - int(normalized*9)
	
	// Ограничиваем диапазон 1-10
	if rating < 1 {
		rating = 10
	}
	if rating > 10 {
		rating = 1
	}
	
	return rating
}

// calculateRatingsForCompletedProjects рассчитывает оценки для всех завершенных проектов
func calculateRatingsForCompletedProjects() error {
	var completedProjects []ConstructionResult
	
	// Получаем все завершенные проекты
	if err := db.Where("is_completed = ?", true).Find(&completedProjects).Error; err != nil {
		return err
	}
	
	if len(completedProjects) == 0 {
		return nil // нет завершенных проектов
	}
	
	// Находим минимальные и максимальные значения для завершенных проектов
	var minCostDiff, maxCostDiff int
	var minDurationDiff, maxDurationDiff int
	
	// Инициализируем первыми значениями
	minCostDiff = completedProjects[0].CostDifference
	maxCostDiff = completedProjects[0].CostDifference
	minDurationDiff = completedProjects[0].DurationDifference
	maxDurationDiff = completedProjects[0].DurationDifference
	
	// Находим минимумы и максимумы
	for _, project := range completedProjects {
		if project.CostDifference < minCostDiff {
			minCostDiff = project.CostDifference
		}
		if project.CostDifference > maxCostDiff {
			maxCostDiff = project.CostDifference
		}
		if project.DurationDifference < minDurationDiff {
			minDurationDiff = project.DurationDifference
		}
		if project.DurationDifference > maxDurationDiff {
			maxDurationDiff = project.DurationDifference
		}
	}
	
	// Обновляем оценки для всех завершенных проектов
	for _, project := range completedProjects {
		costRating := calculateRating(project.CostDifference, minCostDiff, maxCostDiff)
		durationRating := calculateRating(project.DurationDifference, minDurationDiff, maxDurationDiff)
		finalRating := float64(costRating)*0.7 + float64(durationRating)*0.3
		
		if err := db.Model(&project).Updates(map[string]interface{}{
			"cost_rating":     costRating,
			"duration_rating": durationRating,
			"final_rating":    finalRating,
		}).Error; err != nil {
			return err
		}
	}
	
	return nil
}

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
		AllowOrigins:     []string{"*"}, // Разрешаем все источники для разработки
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false, // Должно быть false при AllowOrigins: ["*"]
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

	// Вычисляем разности (projected - planned)
	costDiff := req.ProjectedCost - req.PlannedCost
	durationDiff := req.ProjectedDuration - req.PlannedDuration

	result := ConstructionResult{
		Name:                req.Name,
		PlannedDuration:     req.PlannedDuration,
		PlannedCost:         req.PlannedCost,
		ActualDuration:      req.ActualDuration,
		ActualCost:          req.ActualCost,
		ProjectedDuration:   req.ProjectedDuration,
		ProjectedCost:       req.ProjectedCost,
		CostDifference:      costDiff,
		DurationDifference:  durationDiff,
		IsCompleted:         req.IsCompleted,
		CreatedAt:           time.Now(),
	}

	if err := db.Create(&result).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при сохранении результата"})
		return
	}

	// Пересчитываем оценки для всех завершенных проектов
	if err := calculateRatingsForCompletedProjects(); err != nil {
		log.Printf("Ошибка при пересчете оценок: %v", err)
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

	// Сортировка: сначала по достроенности (достроенные первыми), затем по итоговой оценке (по убыванию), затем по времени создания
	sort.Slice(results, func(i, j int) bool {
		// Сначала сортируем по достроенности (достроенные дома первыми)
		if results[i].IsCompleted != results[j].IsCompleted {
			return results[i].IsCompleted && !results[j].IsCompleted
		}
		
		// Затем по итоговой оценке (по убыванию - от большего к меньшему)
		if results[i].FinalRating != results[j].FinalRating {
			return results[i].FinalRating > results[j].FinalRating
		}
		
		// Наконец по времени создания (раньше созданные первыми)
		return results[i].CreatedAt.Before(results[j].CreatedAt)
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

	// Сортировка: сначала по достроенности (достроенные первыми), затем по итоговой оценке (по убыванию), затем по времени создания
	sort.Slice(results, func(i, j int) bool {
		// Сначала сортируем по достроенности (достроенные дома первыми)
		if results[i].IsCompleted != results[j].IsCompleted {
			return results[i].IsCompleted && !results[j].IsCompleted
		}
		
		// Затем по итоговой оценке (по убыванию - от большего к меньшему)
		if results[i].FinalRating != results[j].FinalRating {
			return results[i].FinalRating > results[j].FinalRating
		}
		
		// Наконец по времени создания (раньше созданные первыми)
		return results[i].CreatedAt.Before(results[j].CreatedAt)
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
