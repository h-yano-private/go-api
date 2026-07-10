// このファイルがメインプログラムという宣言
package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Task struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
}

var tasks = []Task{}

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

	// もしブラウザから、ただのURL(/)にアクセスされたらこんにちはと表示する
	//r.GET("/", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"message": "こんにちは!"}) })

	// タスク一覧を取得するAPI(GET/tasks)
	r.GET("/tasks", func(c *gin.Context) {
		c.JSON(http.StatusOK, tasks)
	})

	r.POST("/tasks", func(c *gin.Context) {
		// 受け取るための入れ物
		var newTask Task
		// 送られてきたデータを入れ物に入れる
		if err := c.ShouldBindJSON(&newTask); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// リストに追加
		newTask.ID = len(tasks) + 1
		tasks = append(tasks, newTask)
		// 成功を通知
		c.JSON(http.StatusCreated, newTask)
	})

	r.DELETE("/tasks/:id", func(c *gin.Context) {
		id := c.Param("id")
		taskID := 0
		// Parse the ID parameter
		if _, err := fmt.Sscanf(id, "%d", &taskID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
			return
		}
		// Find and delete the task
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
		// Parse the ID parameter
		if _, err := fmt.Sscanf(id, "%d", &taskID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
			return
		}
		// Find the task
		for i, task := range tasks {
			if task.ID == taskID {
				// Update the task
				if err := c.ShouldBindJSON(&tasks[i]); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, tasks[i])
				return
			}
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
	})

	// 通信を待ち受ける
	r.Run(":8080")
}
