package handlers

import (
	"net/http"

	"ferma-kz/backend/internal/httpx"
	"ferma-kz/backend/internal/storage"
)

type UploadHandler struct {
	fs *storage.LocalFS
}

func NewUploadHandler(fs *storage.LocalFS) *UploadHandler { return &UploadHandler{fs: fs} }

// Upload — POST /uploads (auth). Мultipart, поле "file".
func (h *UploadHandler) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Некорректная загрузка файла")
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		httpx.Fail(w, http.StatusBadRequest, "Не найден файл (поле 'file')")
		return
	}
	url, err := h.fs.Save(file, header.Size, header.Header.Get("Content-Type"))
	if err != nil {
		httpx.Fail(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.OK(w, map[string]string{"url": url}, http.StatusCreated)
}
