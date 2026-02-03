let chapters = [];
let currentChapterIndex = -1;
let selectedOption = null;

const chapterList = document.getElementById('chapter-list');
const lessonContent = document.getElementById('lesson-content');
const currentTitle = document.getElementById('current-chapter-title');
const progressBar = document.getElementById('progress-bar');
const quizSection = document.getElementById('quiz-section');
const quizQuestion = document.getElementById('quiz-question');
const quizOptions = document.getElementById('quiz-options');
const submitQuiz = document.getElementById('submit-quiz');
const quizFeedback = document.getElementById('quiz-feedback');
const practiceSection = document.getElementById('practice-section');
const practiceContainer = document.getElementById('practice-container');
const practiceGoal = document.getElementById('practice-goal');
const checkPracticeBtn = document.getElementById('check-practice');
const practiceFeedback = document.getElementById('practice-feedback');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// --- Dynamic Data Init ---
async function initApp() {
    // 1. Handle Auth UI
    const user = await getCurrentUser();
    const loginLink = document.getElementById('login-link');
    const userControls = document.getElementById('user-controls');
    const adminLink = document.getElementById('admin-link');
    const userInfo = document.getElementById('user-info');

    if (user) {
        loginLink.classList.add('hidden');
        userControls.classList.remove('hidden');
        userInfo.textContent = `${user.email} (${user.role})`;
        if (user.role === 'admin') {
            adminLink.classList.remove('hidden');
        } else {
            adminLink.classList.add('hidden');
        }
    } else {
        loginLink.classList.remove('hidden');
        userControls.classList.add('hidden');
        adminLink.classList.add('hidden'); // Ensure admin link is hidden if no user
    }

    // 2. Fetch Chapters from Supabase
    const { data, error } = await supabaseClient
        .from('chapters')
        .select('*')
        .order('order_index', { ascending: true });

    if (error) {
        console.error("Error fetching chapters:", error);
        return;
    }

    chapters = data;
    initSidebar();
}

// Initialize Sidebar
function initSidebar() {
    chapterList.innerHTML = chapters.map((chapter, index) => `
        <div class="chapter-item" data-index="${index}" onclick="loadChapter(${index})">
            <span class="chapter-num">Chapter 0${index + 1}</span>
            <span class="chapter-name">${chapter.title}</span>
        </div>
    `).join('');
}

// Load Chapter
function loadChapter(index) {
    if (index < 0 || index >= chapters.length) return;

    currentChapterIndex = index;
    const chapter = chapters[index];

    // Update UI
    currentTitle.textContent = chapter.title;
    lessonContent.innerHTML = chapter.content;
    progressBar.style.width = `${((index + 1) / chapters.length) * 100}%`;

    // Update Sidebar Active
    document.querySelectorAll('.chapter-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });

    // Setup Practice & Quiz
    setupPractice(chapter.practice);
    setupQuiz(chapter.quiz);

    // Update Buttons
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === chapters.length - 1 ? '완료' : '다음';

    // Scroll to top
    document.querySelector('.content-area').scrollTop = 0;
}

// Setup Practice (Fill in the blanks)
function setupPractice(practice) {
    if (!practice) {
        practiceSection.classList.add('hidden');
        return;
    }

    practiceSection.classList.remove('hidden');
    practiceFeedback.style.display = 'none';

    // Render the goal output
    practiceGoal.innerHTML = `<span class="result-title">목표 결과</span><br>${practice.goal}`;

    // Replace "___" with input elements
    let html = practice.template;
    practice.answers.forEach((_, i) => {
        html = html.replace('___', `<input type="text" class="code-input" data-index="${i}" autocomplete="off" spellcheck="false">`);
    });

    practiceContainer.innerHTML = html;
}

checkPracticeBtn.onclick = () => {
    const inputs = practiceContainer.querySelectorAll('.code-input');
    const answers = chapters[currentChapterIndex].practice.answers;
    let allCorrect = true;

    inputs.forEach((input, i) => {
        if (input.value.trim() === answers[i]) {
            input.style.borderColor = 'var(--success-color)';
        } else {
            input.style.borderColor = 'var(--error-color)';
            allCorrect = false;
        }
    });

    practiceFeedback.classList.remove('success', 'error');
    if (allCorrect) {
        practiceFeedback.textContent = "코드가 완벽합니다! 🚀";
        practiceFeedback.classList.add('success');
    } else {
        practiceFeedback.textContent = "빈칸을 다시 확인해 보세요. 🧐";
        practiceFeedback.classList.add('error');
    }
    practiceFeedback.style.display = 'block';
};

// Setup Quiz
function setupQuiz(quiz) {
    quizSection.classList.remove('hidden');
    quizQuestion.textContent = quiz.question;
    quizFeedback.style.display = 'none';
    selectedOption = null;

    quizOptions.innerHTML = quiz.options.map((option, i) => `
        <button class="option-btn" onclick="selectOption(${i})">${option}</button>
    `).join('');
}

function selectOption(index) {
    selectedOption = index;
    document.querySelectorAll('.option-btn').forEach((btn, i) => {
        btn.classList.toggle('selected', i === index);
    });
}

submitQuiz.onclick = () => {
    if (selectedOption === null) {
        alert("정답을 선택해주세요!");
        return;
    }

    const correct = chapters[currentChapterIndex].quiz.answer;
    quizFeedback.classList.remove('success', 'error');

    if (selectedOption === correct) {
        quizFeedback.textContent = "정답입니다! 👏";
        quizFeedback.classList.add('success');
    } else {
        quizFeedback.textContent = "다시 한번 생각해 보세요. 😅";
        quizFeedback.classList.add('error');
    }
    quizFeedback.style.display = 'block';
};

nextBtn.onclick = () => {
    if (currentChapterIndex < chapters.length - 1) {
        loadChapter(currentChapterIndex + 1);
    } else {
        alert("모든 과정을 마쳤습니다! 축하합니다! 🥳");
    }
};

prevBtn.onclick = () => {
    if (currentChapterIndex > 0) {
        loadChapter(currentChapterIndex - 1);
    }
};

// Start
initApp();

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        initApp();
    }
});
