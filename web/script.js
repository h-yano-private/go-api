
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

fetchTasks();