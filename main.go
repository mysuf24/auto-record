package main

import (
	"auto-record/config"
	"auto-record/middleware"
	"auto-record/router"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	// Load environment variables dari .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Buat direktori tmp/videos jika belum ada
	if err := os.MkdirAll("tmp/videos", os.ModePerm); err != nil {
		log.Fatalf("Failed to create videos directory: %v", err)
	}
}

func main() {
	// Inisialisasi koneksi database
	config.InitDB()

	// Setup router
	r := gin.Default()
	r.Use(middleware.CORSMiddleware())

	// Register API routes
	api := r.Group("/api")
	router.Utility(api)

	// Serve video statis langsung dari /videos
	r.LoadHTMLFiles("./frontend/auto_capture.html")

	r.GET("/", func(c *gin.Context) {
		c.HTML(200, "auto_capture.html", nil)
	})

	r.Static("/videos", "./tmp/videos")

	// Jalankan server di port 8090
	if err := r.Run(":8090"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
