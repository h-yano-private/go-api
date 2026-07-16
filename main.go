// このファイルがメインプログラムという宣言
package main

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type Subtask struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
}

type Task struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Completed bool      `json:"completed"`
	Deadline  string    `json:"deadline"`
	Priority  string    `json:"priority"`
	Subtasks  []Subtask `json:"subtasks"`
}

type UpdateTaskInput struct {
	Title     *string    `json:"title"`
	Completed *bool      `json:"completed"`
	Deadline  *string    `json:"deadline"`
	Priority  *string    `json:"priority"`
	Subtasks  *[]Subtask `json:"subtasks"`
}

var tasks = []Task{}

func ensureSubtaskIDs(subtasks []Subtask) []Subtask {
	for idx := range subtasks {
		if subtasks[idx].ID == 0 {
			subtasks[idx].ID = idx + 1
		}
	}
	return subtasks
}

func normalizePriority(priority string) string {
	switch priority {
	case "high", "medium", "low":
		return priority
	default:
		return "medium"
	}
}

func computeTaskCompletion(task Task) bool {
	if len(task.Subtasks) == 0 {
		return task.Completed
	}

	for _, subtask := range task.Subtasks {
		if !subtask.Completed {
			return false
		}
	}
	return true
}

func resolveListenAddr() string {
	preferred := strings.TrimSpace(os.Getenv("PORT"))
	if preferred == "" {
		preferred = "8080"
	}
	if !strings.HasPrefix(preferred, ":") {
		preferred = ":" + preferred
	}

	candidates := []string{preferred}
	for port := 8081; port <= 8090; port++ {
		candidates = append(candidates, ":"+strconv.Itoa(port))
	}

	for _, candidate := range candidates {
		listener, err := net.Listen("tcp", candidate)
		if err == nil {
			listener.Close()
			return candidate
		}
	}

	return preferred
}

func main() {
	r := gin.Default()

	// CORSを許可する設定（ライブラリ不要！）
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// タスク一覧を取得するAPI(GET/tasks)
	r.GET("/tasks", func(c *gin.Context) {
		c.JSON(http.StatusOK, tasks)
	})

	r.POST("/tasks", func(c *gin.Context) {
		var newTask Task
		if err := c.ShouldBindJSON(&newTask); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if newTask.Subtasks == nil {
			newTask.Subtasks = []Subtask{}
		}
		newTask.Priority = normalizePriority(newTask.Priority)
		newTask.Subtasks = ensureSubtaskIDs(newTask.Subtasks)
		newTask.Completed = computeTaskCompletion(newTask)
		newTask.ID = len(tasks) + 1
		tasks = append(tasks, newTask)
		c.JSON(http.StatusCreated, newTask)
	})

	r.DELETE("/tasks/:id", func(c *gin.Context) {
		id := c.Param("id")
		taskID := 0
		if _, err := fmt.Sscanf(id, "%d", &taskID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
			return
		}
		for i, task := range tasks {
			if task.ID == taskID {
				tasks = append(tasks[:i], tasks[i+1:]...)
				c.JSON(http.StatusOK, gin.H{"message": "Task deleted"})
				return
			}
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
	})

	r.PUT("/tasks/:id", func(c *gin.Context) {
		id := c.Param("id")
		taskID := 0
		if _, err := fmt.Sscanf(id, "%d", &taskID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
			return
		}

		for i := range tasks {
			if tasks[i].ID == taskID {
				var input UpdateTaskInput
				if err := c.ShouldBindJSON(&input); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}

				if input.Title != nil {
					tasks[i].Title = *input.Title
				}
				if input.Deadline != nil {
					tasks[i].Deadline = *input.Deadline
				}
				if input.Priority != nil {
					tasks[i].Priority = normalizePriority(*input.Priority)
				}
				if input.Subtasks != nil {
					tasks[i].Subtasks = ensureSubtaskIDs(*input.Subtasks)
				}
				if input.Completed != nil {
					if len(tasks[i].Subtasks) > 0 {
						for j := range tasks[i].Subtasks {
							tasks[i].Subtasks[j].Completed = *input.Completed
						}
					}
					tasks[i].Completed = *input.Completed
				}
				if len(tasks[i].Subtasks) > 0 {
					tasks[i].Completed = computeTaskCompletion(tasks[i])
				}

				c.JSON(http.StatusOK, tasks[i])
				return
			}
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
	})

	addr := resolveListenAddr()
	fmt.Printf("Listening and serving HTTP on %s\n", addr)
	r.Run(addr)
}
