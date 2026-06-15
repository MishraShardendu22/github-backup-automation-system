package websocket

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/MishraShardendu22/github-backup/backend/db"
	ws "github.com/gofiber/websocket/v2"
)

type Hub struct {
	clients   map[*ws.Conn]bool
	mu        sync.RWMutex
	broadcast chan []byte
}

var DefaultHub = &Hub{
	clients:   make(map[*ws.Conn]bool),
	broadcast: make(chan []byte, 256),
}

func (h *Hub) Register(c *ws.Conn) {
	h.mu.Lock()
	h.clients[c] = true
	h.mu.Unlock()
}

func (h *Hub) Unregister(c *ws.Conn) {
	h.mu.Lock()
	delete(h.clients, c)
	h.mu.Unlock()
}

func (h *Hub) Broadcast(msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients {
		client.WriteMessage(ws.TextMessage, msg)
	}
}

func (h *Hub) Run() {
	for msg := range h.broadcast {
		h.Broadcast(msg)
	}
}

func HandleWebSocket(c *ws.Conn) {
	DefaultHub.Register(c)
	defer DefaultHub.Unregister(c)

	for {
		_, _, err := c.ReadMessage()
		if err != nil {
			break
		}
	}
}


// data source (database) is polling.
func (h *Hub) StartPolling() {
	go func() {
		var lastLogID int
		for {
			time.Sleep(2 * time.Second)

			h.mu.RLock()
			clientCount := len(h.clients)
			h.mu.RUnlock()

			if clientCount == 0 {
				continue
			}

			ctx := context.Background()

			rows, err := db.Pool.Query(ctx,
				`SELECT id, level, message, repository, created_at
				 FROM execution_logs WHERE id > $1 ORDER BY id LIMIT 50`, lastLogID)
			if err != nil {
				continue
			}

			for rows.Next() {
				var id int
				var level, message, repo string
				var createdAt time.Time
				if err := rows.Scan(&id, &level, &message, &repo, &createdAt); err != nil {
					continue
				}
				if id > lastLogID {
					lastLogID = id
				}
				logMsg, _ := json.Marshal(map[string]interface{}{
					"type":       "log",
					"id":         id,
					"level":      level,
					"message":    message,
					"repository": repo,
					"timestamp":  createdAt,
				})
				h.Broadcast(logMsg)
			}
			rows.Close()
		}
	}()
}