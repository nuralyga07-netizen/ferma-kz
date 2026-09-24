package storage

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

// LocalFS хранит файлы на диске и возвращает URL вида /uploads/<name>.
type LocalFS struct {
	dir string
}

func NewLocalFS(dir string) (*LocalFS, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("create upload dir: %w", err)
	}
	return &LocalFS{dir: dir}, nil
}

var allowedExt = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

const maxUploadSize = 5 << 20 // 5 MB

// Save сохраняет файл из multipart и возвращает его URL.
func (s *LocalFS) Save(file multipart.File, size int64, contentType string) (string, error) {
	defer file.Close()

	ext, ok := allowedExt[contentType]
	if !ok {
		return "", fmt.Errorf("допустимые форматы: JPG, PNG, WEBP")
	}
	if size > maxUploadSize {
		return "", fmt.Errorf("файл больше 5 МБ")
	}

	name := time.Now().Format("20060102150405") + "-" + uuid.NewString()[:8] + ext
	path := filepath.Join(s.dir, name)

	dst, err := os.Create(path)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := copyLimited(dst, file, maxUploadSize); err != nil {
		os.Remove(path)
		return "", err
	}
	return "/uploads/" + name, nil
}

func copyLimited(dst io.Writer, src io.Reader, max int64) (int64, error) {
	const bufSize = 32 * 1024
	buf := make([]byte, bufSize)
	var total int64
	for {
		n, rerr := src.Read(buf)
		if n > 0 {
			total += int64(n)
			if total > max {
				return total, fmt.Errorf("файл слишком большой")
			}
			if _, werr := dst.Write(buf[:n]); werr != nil {
				return total, werr
			}
		}
		if rerr != nil {
			if errors.Is(rerr, io.EOF) {
				return total, nil
			}
			return total, rerr
		}
	}
}

func (s *LocalFS) Dir() string {
	return s.dir
}
