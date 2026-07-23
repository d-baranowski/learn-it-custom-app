package image

import (
	"bytes"
	"github.com/nfnt/resize"
	"image"
	"image/jpeg"
)

func ResizeImage(data []byte, width uint) ([]byte, error) {
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	resizedImg := resize.Resize(width, 0, img, resize.Lanczos3)

	var buf bytes.Buffer
	err = jpeg.Encode(&buf, resizedImg, nil)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}
