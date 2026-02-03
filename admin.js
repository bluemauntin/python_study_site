// Admin Guard
adminGuard();

const chapterListBody = document.getElementById('chapter-list-body');
const userListBody = document.getElementById('user-list-body');
const chapterModal = document.getElementById('chapter-modal');
const chapterForm = document.getElementById('chapter-form');

let currentChapters = [];
let currentQuestionType = 'fill-blank';

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

// --- Question Type Handling ---
function setQuestionType(type) {
    currentQuestionType = type;
    document.getElementById('edit-question-type').value = type;

    // Update button states
    document.querySelectorAll('.question-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    // Show/hide code section based on type
    const codeSection = document.getElementById('code-section');
    const blankHint = document.getElementById('blank-hint');
    const answerHelper = document.getElementById('answer-helper');

    switch (type) {
        case 'fill-blank':
            codeSection.classList.remove('hidden');
            blankHint.style.display = 'inline';
            answerHelper.innerHTML = `
                빈칸채우기: 각 빈칸의 정답을 <strong>줄바꿈</strong>으로 구분하세요.<br>
                예: 첫번째 빈칸 정답<br>&nbsp;&nbsp;&nbsp;&nbsp;두번째 빈칸 정답
            `;
            break;
        case 'short-answer':
            codeSection.classList.add('hidden');
            answerHelper.innerHTML = `
                주관식 정답을 입력하세요.<br>
                대체 정답이 있는 경우 줄바꿈으로 구분하세요.<br>
                정규식 사용 가능: <code>/패턴/</code>
            `;
            break;
        case 'code-writing':
            codeSection.classList.remove('hidden');
            blankHint.style.display = 'none';
            answerHelper.innerHTML = `
                기대하는 전체 코드를 입력하세요.<br>
                또는 정규식으로 핵심 패턴만 검사할 수 있습니다.
            `;
            break;
        case 'theory':
            codeSection.classList.add('hidden');
            answerHelper.innerHTML = `
                이론 설명 문제입니다. 정답이 필요 없을 수 있습니다.<br>
                평가 기준이 있다면 입력하세요.
            `;
            break;
    }

    updateAnswerPreview();
}

// --- Answer Preview ---
function updateAnswerPreview() {
    const answersText = document.getElementById('edit-practice-answers').value;
    const previewEl = document.getElementById('answer-preview');

    if (!answersText.trim()) {
        previewEl.textContent = '정답을 입력하면 여기에 미리보기가 표시됩니다.';
        return;
    }

    const answers = parseAnswers(answersText);

    if (currentQuestionType === 'fill-blank') {
        previewEl.innerHTML = answers.map((ans, i) =>
            `<span style="color: #58a6ff;">빈칸 ${i + 1}:</span> ${escapeHtml(ans)}`
        ).join('\n');
    } else {
        previewEl.textContent = answersText;
    }
}

function parseAnswers(text) {
    // 줄바꿈으로 구분된 정답 파싱
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add event listener for real-time preview
document.getElementById('edit-practice-answers').addEventListener('input', updateAnswerPreview);

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
    document.getElementById('modal-title').innerText = '📝 새 챕터 추가';
    setQuestionType('fill-blank');
    document.getElementById('answer-preview').textContent = '정답을 입력하면 여기에 미리보기가 표시됩니다.';
    chapterModal.style.display = 'flex';
}

function openEditModal(index) {
    const ch = currentChapters[index];
    document.getElementById('edit-id').value = ch.id;
    document.getElementById('edit-title').value = ch.title;
    document.getElementById('edit-content').value = ch.content;

    // 문제 유형 설정 (저장된 값이 있으면 사용, 없으면 기본값)
    const questionType = ch.practice?.type || 'fill-blank';
    setQuestionType(questionType);

    // 템플릿 설정
    document.getElementById('edit-practice-template').value = ch.practice?.template || '';

    // 정답 설정 - 배열이면 줄바꿈으로 변환
    const answers = ch.practice?.answers;
    if (Array.isArray(answers)) {
        document.getElementById('edit-practice-answers').value = answers.join('\n');
    } else if (typeof answers === 'string') {
        document.getElementById('edit-practice-answers').value = answers;
    } else {
        document.getElementById('edit-practice-answers').value = '';
    }

    // 목표 결과 설정
    document.getElementById('edit-practice-goal').value = ch.practice?.goal || '';

    // 다중 정답 허용 체크박스
    document.getElementById('edit-allow-multiple-answers').checked = ch.practice?.allowMultiple || false;

    document.getElementById('modal-title').innerText = '📝 챕터 수정';
    updateAnswerPreview();
    chapterModal.style.display = 'flex';
}

function closeModal() {
    chapterModal.style.display = 'none';
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chapterModal.style.display === 'flex') {
        closeModal();
    }
});

// 모달 배경 클릭으로 닫기
chapterModal.addEventListener('click', (e) => {
    if (e.target === chapterModal) {
        closeModal();
    }
});

// 미리보기 함수
function previewQuestion() {
    const title = document.getElementById('edit-title').value;
    const content = document.getElementById('edit-content').value;
    const template = document.getElementById('edit-practice-template').value;
    const answers = document.getElementById('edit-practice-answers').value;
    const goal = document.getElementById('edit-practice-goal').value;

    // 간단한 알럿으로 미리보기 (추후 팝업 개선 가능)
    const preview = `
=== 문제 미리보기 ===

📖 제목: ${title}

📋 유형: ${currentQuestionType}

📝 설명:
${content}

${template ? `💻 코드 템플릿:\n${template}\n` : ''}

✅ 정답:
${answers}

${goal ? `🎯 기대 결과:\n${goal}` : ''}
    `.trim();

    alert(preview);
}

chapterForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;

    // 정답 파싱 - 줄바꿈으로 구분
    const answersText = document.getElementById('edit-practice-answers').value;
    const answersArray = parseAnswers(answersText);

    const payload = {
        title: document.getElementById('edit-title').value,
        content: document.getElementById('edit-content').value,
        practice: {
            type: currentQuestionType,
            template: document.getElementById('edit-practice-template').value,
            answers: currentQuestionType === 'fill-blank' ? answersArray : answersText,
            goal: document.getElementById('edit-practice-goal').value,
            allowMultiple: document.getElementById('edit-allow-multiple-answers').checked
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

