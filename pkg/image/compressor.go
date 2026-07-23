package image

import (
	"fmt"
	compression "github.com/nurlantulemisov/imagecompression"
)

// Function to initialize compression
func InitializeCompression(quality int) (*compression.ImageCompression, error) {
	compressor, err := compression.New(quality)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize compression: %w", err)
	}
	return compressor, nil
}
