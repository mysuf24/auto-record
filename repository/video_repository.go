package repository

import (
	"auto-record/config"
	"auto-record/dto"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

// SaveVideoWithDeviceInfo menyimpan video ke file sistem dan metadata perangkat ke database
func SaveVideoWithDeviceInfo(videoBytes []byte, filename string, deviceInfo dto.DeviceInfoDTO) (string, error) {
	id := uuid.New()
	createdAt := time.Now()

	// Ambil path penyimpanan dari .env
	basePath := os.Getenv("VIDEO_SAVE_PATH")
	if basePath == "" {
		basePath = "./tmp/videos"
	}

	// Pastikan direktori ada
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return "", fmt.Errorf("failed to create video dir: %w", err)
	}

	savePath := filepath.Join(basePath, filename)

	// Logging path yang dipakai
	fmt.Println("Saving video to:", savePath)

	if err := os.WriteFile(savePath, videoBytes, 0644); err != nil {
		return "", err
	}

	_, err := config.DB.Exec(`
		INSERT INTO videos (
			id, file_path, created_at,
			device_model, ip_address, user_agent,
			network, platform, latitude, longitude
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, id, filename, createdAt,
		deviceInfo.DeviceModel,
		deviceInfo.IPAddress,
		deviceInfo.UserAgent,
		deviceInfo.Network,
		deviceInfo.Platform,
		deviceInfo.Latitude,
		deviceInfo.Longitude,
	)

	if err != nil {
		return "", err
	}

	publicURL := os.Getenv("PUBLIC_URL")
	if publicURL == "" {
		publicURL = "http://localhost:8090"
	}
	videoURL := fmt.Sprintf("%s/videos/%s", publicURL, filename)
	return videoURL, nil
}
