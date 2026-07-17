const API_URL = 'https://sturdy-space-zebra-pjv6wwgwxp9529r6r-8080.app.github.dev/tasks';
let tasksCache = [];
let statusFilter = 'all';
let deadlineFilter = 'all';
let keywordFilter = '';
let sortOrder = 'default';

function isUrgent(deadline) {
    if (!deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    const daysUntil = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3 && daysUntil >= 0;
}

function isOverdue(deadline) {
    if (!deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    return deadlineDate < today;
}

function getTaskProgress(task) {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const total = task.subtasks.length;
    const done = task.subtasks.filter(sub => sub.completed).length;
    const percent = Math.round((done / total) * 100);
    return { total, done, percent };
}

function getPriorityLabel(priority) {
    switch (priority) {
        case 'high': return '高';
        case 'low': return '低';
        default: return '中';
    }
}

function getPriorityRank(priority) {
    switch ((priority || 'medium').toLowerCase()) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
    }
}

function sortTasks(tasks) {
    const sortedTasks = [...tasks];

    if (sortOrder === 'priority-desc') {
        sortedTasks.sort((a, b) => getPriorityRank(b.priority) - getPriorityRank(a.priority));
    } else if (sortOrder === 'priority-asc') {
        sortedTasks.sort((a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority));
    }

    return sortedTasks;
}

function getFilteredTasks() {
    const normalizedKeyword = keywordFilter.trim().toLowerCase();

    const filteredTasks = tasksCache.filter(task => {
        if (statusFilter === 'completed' && !task.completed) return false;
        if (statusFilter === 'not-completed' && task.completed) return false;
        if (deadlineFilter === 'overdue' && !isOverdue(task.deadline)) return false;
        if (deadlineFilter === 'due-soon' && !isUrgent(task.deadline)) return false;
        if (deadlineFilter === 'no-deadline' && task.deadline) return false;
        if (normalizedKeyword) {
            const taskText = `${task.title} ${task.deadline || ''} ${(task.subtasks || []).map(subtask => subtask.title).join(' ')}`.toLowerCase();
            if (!taskText.includes(normalizedKeyword)) return false;
        }
        return true;
    });

    return sortTasks(filteredTasks);
}

function applyFilters(type, value) {
    if (type === 'status') {
        statusFilter = value;
    }
    if (type === 'deadline') {
        deadlineFilter = value;
    }
    renderTasks();
}

function applyKeywordSearch(value) {
    keywordFilter = value;
    renderTasks();
}

function applySort(value) {
    sortOrder = value;
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';
    const tasks = getFilteredTasks();

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.onchange = () => toggleComplete(task.id, checkbox.checked);
        li.appendChild(checkbox);

        const content = document.createElement('div');
        content.className = 'task-content';

        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.title;
        content.appendChild(title);

        const priority = document.createElement('div');
        priority.className = `task-priority ${task.priority || 'medium'}`;
        priority.textContent = `優先度: ${getPriorityLabel(task.priority)}`;
        content.appendChild(priority);

        if (task.deadline) {
            const deadline = document.createElement('div');
            deadline.className = `task-deadline ${isUrgent(task.deadline) ? 'urgent' : ''}`;
            deadline.textContent = `期限: ${new Date(task.deadline).toLocaleDateString('ja-JP')}`;
            content.appendChild(deadline);
        }

        const progress = getTaskProgress(task);
        if (progress) {
            const progressLine = document.createElement('div');
            progressLine.className = 'task-progress';

            const progressText = document.createElement('span');
            progressText.textContent = `${progress.percent}% (${progress.done}/${progress.total})`;
            progressLine.appendChild(progressText);

            const barTrack = document.createElement('div');
            barTrack.className = 'progress-track';

            const barFill = document.createElement('div');
            barFill.className = 'progress-fill';
            barFill.style.width = `${progress.percent}%`;
            barTrack.appendChild(barFill);

            progressLine.appendChild(barTrack);
            content.appendChild(progressLine);
        }

        if (task.subtasks && task.subtasks.length > 0) {
            const subList = document.createElement('ul');
            subList.className = 'subtask-list';

            task.subtasks.forEach(subtask => {
                const subLi = document.createElement('li');
                subLi.className = `subtask-item ${subtask.completed ? 'completed' : ''}`;

                const subCheckbox = document.createElement('input');
                subCheckbox.type = 'checkbox';
                subCheckbox.className = 'subtask-checkbox';
                subCheckbox.checked = subtask.completed;
                subCheckbox.onchange = () => toggleSubtaskComplete(task.id, subtask.id, subCheckbox.checked);
                subLi.appendChild(subCheckbox);

                const subTitle = document.createElement('div');
                subTitle.className = 'subtask-title';
                subTitle.textContent = subtask.title;
                subLi.appendChild(subTitle);

                subList.appendChild(subLi);
            });

            content.appendChild(subList);
        }

        li.appendChild(content);

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const addSubtaskButton = document.createElement('button');
        addSubtaskButton.textContent = 'サブタスク追加';
        addSubtaskButton.className = 'btn-subtask-add';
        addSubtaskButton.onclick = () => addSubtask(task.id);
        actions.appendChild(addSubtaskButton);

        const editButton = document.createElement('button');
        editButton.textContent = '編集';
        editButton.className = 'btn-edit';
        editButton.onclick = () => {
            const newTitle = prompt('新しいタイトルを入力してください:', task.title);
            if (newTitle) {
                updateTask(task.id, { title: newTitle });
            }
        };
        actions.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '削除';
        deleteButton.className = 'btn-delete';
        deleteButton.onclick = () => deleteTask(task.id);
        actions.appendChild(deleteButton);

        li.appendChild(actions);
        list.appendChild(li);
    });
}

async function fetchTasks(){
    try{
        const responce = await fetch(API_URL);
        const tasks = await responce.json();

        tasksCache = tasks || [];
        renderTasks();
    } catch (error){
        console.error('通信エラーが発生しました:', error);
    }
}

async function postTask(){
    const input = document.getElementById('task-input');
    const deadlineInput = document.getElementById('task-deadline');
    const priorityInput = document.getElementById('task-priority');
    const title = input.value;
    const deadline = deadlineInput.value;
    const priority = priorityInput.value;

    if (!title){
        alert("入力されていません");
        return;
    }

    await addTask(title, deadline, priority);
} 

async function addTask(title, deadline = '', priority = 'medium'){
    const responce = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json',
        },
        body: JSON.stringify({ 
            title: title,
            deadline: deadline,
            priority: priority,
            completed: false,
            subtasks: []
        }),
    })
    
    if (responce.ok){
        console.log("追加成功!");
        document.getElementById('task-input').value = '';
        document.getElementById('task-deadline').value = '';
        document.getElementById('task-priority').value = 'medium';
        fetchTasks();
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

async function updateTask(id, data){
    try{
        const responce = await fetch(`${API_URL}/${id}`, { 
            method: 'PUT', 
            headers: {'Content-Type' : 'application/json',},
            body: JSON.stringify(data)
        });
        if (!responce.ok) throw new Error('更新に失敗しました');
        fetchTasks();

    } catch (error){
        console.error('更新エラーが発生しました:', error);
    }
}

async function toggleComplete(id, isCompleted){
    try{
        const task = tasksCache.find(item => item.id === id);
        const updateData = { completed: isCompleted };

        if (task && task.subtasks && task.subtasks.length > 0) {
            updateData.subtasks = task.subtasks.map(subtask => ({
                id: subtask.id,
                title: subtask.title,
                completed: isCompleted
            }));
        }

        updateTask(id, updateData);
    } catch (error){
        console.error('完了状態の更新に失敗しました:', error);
    }
}

async function toggleSubtaskComplete(taskId, subtaskId, isCompleted){
    try{
        const task = tasksCache.find(item => item.id === taskId);
        if (!task) return;

        const subtasks = task.subtasks.map(subtask => {
            if (subtask.id === subtaskId) {
                return {
                    id: subtask.id,
                    title: subtask.title,
                    completed: isCompleted
                };
            }
            return subtask;
        });

        updateTask(taskId, { subtasks });
    } catch (error) {
        console.error('サブタスクの更新に失敗しました:', error);
    }
}

async function addSubtask(taskId) {
    const title = prompt('サブタスク名を入力してください:');
    if (!title) return;

    const task = tasksCache.find(item => item.id === taskId);
    if (!task) return;

    const nextId = task.subtasks && task.subtasks.length > 0
        ? Math.max(...task.subtasks.map(sub => sub.id)) + 1
        : 1;

    const subtasks = task.subtasks ? [...task.subtasks] : [];
    subtasks.push({ id: nextId, title, completed: false });

    updateTask(taskId, { subtasks });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    console.log("アプリの初期化完了！");
});
