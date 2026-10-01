package main

import (
	"embed"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

// Демо-фото товаров лежат в cmd/seed/images и вшиваются в бинарник.
// Имя файла совпадает с тем, что товар хранит в images: /uploads/<имя>.
//
//go:embed images/*.jpg
var demoImages embed.FS

// copyDemoImages раскладывает демо-фото в каталог загрузок (UPLOAD_DIR).
// Уже существующие файлы не трогает: фото, заменённое вручную, seed не затрёт.
func copyDemoImages(uploadDir string) (copied int, err error) {
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		return 0, err
	}
	entries, err := fs.ReadDir(demoImages, "images")
	if err != nil {
		return 0, err
	}
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".jpg") {
			continue
		}
		dst := filepath.Join(uploadDir, e.Name())
		if _, err := os.Stat(dst); err == nil {
			continue
		} else if !errors.Is(err, fs.ErrNotExist) {
			return copied, err
		}
		data, err := demoImages.ReadFile("images/" + e.Name())
		if err != nil {
			return copied, err
		}
		if err := os.WriteFile(dst, data, 0o644); err != nil {
			return copied, err
		}
		copied++
	}
	return copied, nil
}
