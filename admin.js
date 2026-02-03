// Admin Guard
adminGuard();

const chapterListBody = document.getElementById('chapter-list-body');
const userListBody = document.getElementById('user-list-body');
const chapterModal = document.getElementById('chapter-modal');
const chapterForm = document.getElementById('chapter-form');

let currentChapters = [];

// Load Panels
function showPanel(panelId) {
    document.getElementById('chapters-panel').style.display = panelId === 'chapters' ? 'block' : 'none';
    document.getElementById('users-panel').style.display = panelId === 'users' ? 'block' : 'none';

    document.querySelectorAll('.admin-menu-item').forEach(item => {
        item.classList.toggle('active', item.innerText.includes(panelId === 'chapters' ? '커리큘럼' : '사용자'));
    });

    if (panelId === 'chapters') loadChapters();
    if (panelId === 'users') loadUsers();
}

// --- Chapter CRUD ---
async function loadChapters() {
    const { data, error } = await supabaseClient
        .from('chapters')
        .select('*')
        .order('order_index', { ascending: true });

    if (error) return console.error(error);
    currentChapters = data;

    chapterListBody.innerHTML = data.map((ch, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${ch.title}</td>
            <td>
                <button class="action-btn edit-btn" onclick="openEditModal(${i})">수정</button>
                <button class="action-btn delete-btn" onclick="deleteChapter('${ch.id}')">삭제</button>
            </td>
        </tr>
    `).join('');
}

function openCreateModal() {
    chapterForm.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('modal-title').innerText = '새 챕터 추가';
    chapterModal.style.display = 'flex';
}

function openEditModal(index) {
    const ch = currentChapters[index];
    document.getElementById('edit-id').value = ch.id;
    document.getElementById('edit-title').value = ch.title;
    document.getElementById('edit-content').value = ch.content;
    document.getElementById('edit-practice-template').value = ch.practice.template;
    document.getElementById('edit-practice-answers').value = ch.practice.answers.join(',');
    document.getElementById('edit-practice-goal').value = ch.practice.goal;

    document.getElementById('modal-title').innerText = '챕터 수정';
    chapterModal.style.display = 'flex';
}

function closeModal() {
    chapterModal.style.display = 'none';
}

chapterForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const payload = {
        title: document.getElementById('edit-title').value,
        content: document.getElementById('edit-content').value,
        practice: {
            template: document.getElementById('edit-practice-template').value,
            answers: document.getElementById('edit-practice-answers').value.split(',').map(a => a.trim()),
            goal: document.getElementById('edit-practice-goal').value
        }
    };

    if (id) {
        await supabaseClient.from('chapters').update(payload).eq('id', id);
    } else {
        const order_index = currentChapters.length;
        await supabaseClient.from('chapters').insert({ ...payload, order_index });
    }

    closeModal();
    loadChapters();
};

async function deleteChapter(id) {
    if (confirm('정말 삭제하시겠습니까?')) {
        await supabaseClient.from('chapters').delete().eq('id', id);
        loadChapters();
    }
}

// --- User Management ---
async function loadUsers() {
    const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('*, auth_user: id (email)'); // Assuming standard profile setup

    userListBody.innerHTML = profiles.map(profile => `
        <tr>
            <td>계정 ID: ${profile.id.substring(0, 8)}...</td>
            <td><strong>${profile.role}</strong></td>
            <td>
                <select onchange="updateUserRole('${profile.id}', this.value)">
                    <option value="user" ${profile.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="admin" ${profile.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </td>
        </tr>
    `).join('');
}

async function updateUserRole(userId, newRole) {
    await supabaseClient.from('profiles').update({ role: newRole }).eq('id', userId);
    alert('역할이 변경되었습니다.');
    loadUsers();
}

// Init
loadChapters();
