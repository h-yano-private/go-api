// このファイルがメインプログラムという宣言
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Task struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

var tasks = []Task{
	{ID: "1", Title:"Go言語の勉強をする"},
	{ID: "2", Title:"Gitのコミットをする"},
}

func main() {
	r := gin.Default()

	// もしブラウザから、ただのURL(/)にアクセスされたらこんにちはと表示する
	//r.GET("/", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"message": "こんにちは!"}) })

	// タスク一覧を取得するAPI(GET/tasks)
	r.GET("/tasks", func(c *gin.Context){
		c.JSON(http.StatusOK, tasks)
	})

	r.Run()
}
