
const API_URL = 'https://sturdy-space-zebra-pjv6wwgwxp9529r6r-8080.app.github.dev/tasks';

async function fetchTasks(){
    try{
        const responce = await fetch(API_URL);
        const tasks = await responce.json();

        const list = document.getElementById('task-list');
        list.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.title;

            // ここでタスクの削除ボタンを作成
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '削除';
            deleteButton.onclick = () => deleteTask(task.id);
            li.appendChild(deleteButton);

            // ここでタスクの編集ボタンを作成
            const editButton = document.createElement('button');
            editButton.textContent = '編集';
            editButton.onclick = () => {
                const newTitle = prompt('新しいタイトルを入力してください:', task.title);
                if (newTitle) {
                    updateTask(task.id, newTitle);
                }
            };
            li.appendChild(editButton);

            list.appendChild(li);
        })
    } catch (error){
        console.error('通信エラーが発生しました:', error);
    }
}

async function postTask(){
    const input = document.getElementById('task-input');
    const title = input.value;

    if (!title){
        alert("入力されていません");
        return;
    }

    await addTask(title);
} 

async function addTask(title){
    const responce = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json',
        },
        body: JSON.stringify({ title: title}),
    })
    
    if (responce.ok){
        console.log("追加成功!");
        location.reload();
    }
}

async function deleteTask(id){
    try {
        const responce = await fetch(`${API_URL}/${id}`, { method: 'DELETE',});
        if (!responce.ok) throw new Error('削除に失敗しました');
        fetchTasks();
    } catch (error) {
        console.error('削除エラーが発生しました:', error);
    }
}

async function updateTask(id, newTitle){
    try{
        const responce = await fetch(`${API_URL}/${id}`, { method: 'PUT', headers: {'Content-Type' : 'application/json',},body: JSON.stringify({ title: newTitle})});
        if (!responce.ok) throw new Error('更新に失敗しました');
        fetchTasks();

    } catch (error){
        console.error('更新エラーが発生しました:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    console.log("アプリの初期化完了！");
});