document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT SELECTORS ---
    const loginPage = document.getElementById('login-page');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const closeLoginBtn = document.getElementById('close-login-btn');
    const tryFirstLink = document.getElementById('try-first-link');
    const logoutBtn = document.getElementById('logout-btn');
    const displayNickname = document.getElementById('display-nickname');
    const navButtons = document.querySelectorAll('.nav-btn');
    const contentSections = document.querySelectorAll('.content-section');

    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const starterBubbles = document.getElementById('starter-bubbles');
    const moodSelector = document.getElementById('mood-selector');

    const moodChartCanvas = document.getElementById('mood-chart');
    const weeklySummaryContent = document.getElementById('weekly-summary-content');

    const journalTextarea = document.getElementById('journal-textarea');
    const saveJournalBtn = document.getElementById('save-journal-btn');
    const downloadJournalBtn = document.getElementById('download-journal-btn');
    const journalHistory = document.getElementById('journal-history');
    const micBtn = document.getElementById('mic-btn');

    const habitList = document.getElementById('habit-list');
    const newHabitInput = document.getElementById('new-habit-input');
    const addHabitBtn = document.getElementById('add-habit-btn');

    const memoryLaneContent = document.getElementById('memory-lane-content');

    const breathingTool = document.getElementById('breathing-tool');
    const closeBreathingToolBtn = document.getElementById('close-breathing-tool');

    // --- APP STATE ---
    let appState = {
        user: { name: '', nickname: 'friend', age: null, loggedIn: false },
        checkIns: [],
        journal: [],
        habits: [],
        currentCheckIn: {},
        conversationState: 'idle',
    };

    let moodChart;
    const today = new Date().toISOString().split('T')[0];

    // --- BOT RESPONSES ---
    const botResponses = {
        greetings: ["Hello, {nickname}. Whenever you're ready, we can start a check-in."],
        askReason: "Thank you for sharing that. What do you think is the main reason you're feeling this way?",
        askDaySummary: "I see. And what has your day been like? Could you share a few things you've been through?",
        finish: "Thank you for sharing so openly, {nickname}. Your thoughts are safe here. Remember to be kind to yourself.",
        tutorial: "I'm Clarity, your personal check-in bot. You can talk to me daily to track your mood and journal your thoughts. Over time, the Dashboard and Memory Lane will show you insightful trends about your emotional well-being.",
        quote: "'The first step toward change is awareness. The second step is acceptance.' - Nathaniel Branden"
    };

    // --- INITIALIZATION ---
    function init() {
        loadData();
        if (appState.user.loggedIn) {
            showApp();
        } else {
            showLogin();
        }
        setupEventListeners();
        renderAll();
        lucide.createIcons();
    }

    function setupEventListeners() {
        loginForm.addEventListener('submit', handleLogin);
        closeLoginBtn.addEventListener('click', handleGuestSession);
        tryFirstLink.addEventListener('click', (e) => { e.preventDefault(); handleGuestSession(); });
        logoutBtn.addEventListener('click', handleLogout);
        navButtons.forEach(btn => btn.addEventListener('click', () => handleNavigation(btn.dataset.target)));
        starterBubbles.addEventListener('click', handleStarterBubble);
        moodSelector.addEventListener('click', handleMoodSelection);
        chatForm.addEventListener('submit', handleChatSubmit);
        saveJournalBtn.addEventListener('click', saveJournalEntry);
        downloadJournalBtn.addEventListener('click', downloadJournal);
        addHabitBtn.addEventListener('click', addHabit);
        habitList.addEventListener('change', handleHabitToggle);
        closeBreathingToolBtn.addEventListener('click', hideBreathingTool);
        chatMessages.addEventListener('click', handleChatAction);
    }

    // --- LOGIN & NAVIGATION ---
    function handleLogin(e) {
        e.preventDefault();
        appState.user = {
            name: document.getElementById('user-name').value,
            nickname: document.getElementById('user-nickname').value,
            age: document.getElementById('user-age').value,
            loggedIn: true
        };
        saveData();
        showApp();
    }

    function handleGuestSession() {
        appState.user.loggedIn = false;
        showApp(true);
    }

    function handleLogout() {
        localStorage.removeItem('clarityAppState');
        window.location.reload();
    }

    function showLogin() {
        loginPage.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }

    function showApp(isGuest = false) {
        loginPage.classList.add('fade-out');
        setTimeout(() => loginPage.classList.add('hidden'), 500);
        appContainer.classList.remove('hidden');
        setTimeout(() => appContainer.classList.add('opacity-100'), 50);
        displayNickname.textContent = isGuest ? 'guest' : appState.user.nickname;
        startConversation();
    }

    function handleNavigation(targetId) {
        contentSections.forEach(section => section.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');
        navButtons.forEach(btn => {
            btn.classList.toggle('nav-active', btn.dataset.target === targetId);
            btn.classList.toggle('nav-inactive', btn.dataset.target !== targetId);
        });
        renderAll();
    }

    // --- CHATBOT LOGIC ---
    function setChatInputMode(mode) {
        starterBubbles.classList.toggle('hidden', mode !== 'starter');
        moodSelector.classList.toggle('hidden', mode !== 'mood');
        chatForm.classList.toggle('hidden', mode !== 'text');
    }

    function startConversation() {
        chatMessages.innerHTML = '';
        const greeting = botResponses.greetings[0].replace('{nickname}', appState.user.nickname);
        addBotMessage(greeting);
        resetConversation();
    }
    
    function resetConversation() {
        appState.conversationState = 'idle';
        appState.currentCheckIn = {};
        setChatInputMode('starter');
    }

    function addBotMessage(text, actions = []) {
        const messageEl = document.createElement('div');
        messageEl.className = 'flex items-start gap-2 slide-in-up';
        let actionsHTML = '';
        if (actions.length > 0) {
            actionsHTML = '<div class="mt-2 flex gap-2">';
            actions.forEach(action => {
                actionsHTML += `<button class="chat-action-btn" data-action="${action.action}">${action.label}</button>`;
            });
            actionsHTML += '</div>';
        }
        messageEl.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-sky-200 flex items-center justify-center font-bold text-sky-700 text-sm flex-shrink-0">C</div>
            <div class="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none max-w-md">
                <p>${text}</p>
                ${actionsHTML}
            </div>
        `;
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageEl;
    }

    function addUserMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'flex items-start gap-2 justify-end slide-in-up';
        messageEl.innerHTML = `<div class="bg-sky-600 text-white p-3 rounded-lg rounded-br-none max-w-md">${text}</div>`;
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function handleStarterBubble(e) {
        if (!e.target.classList.contains('starter-btn')) return;
        const text = e.target.textContent;
        addUserMessage(text);
        if (text.includes('check-in')) {
            appState.conversationState = 'awaiting_mood';
            addBotMessage("Of course. Let's start with your mood on a scale of 1 to 5.");
            setChatInputMode('mood');
        } else if (text.includes('work')) {
            addBotMessage(botResponses.tutorial);
            resetConversation();
        } else if (text.includes('quote')) {
            addBotMessage(botResponses.quote);
            resetConversation();
        }
    }

    function handleMoodSelection(e) {
        if (appState.conversationState !== 'awaiting_mood' || !e.target.closest('.mood-btn')) return;
        const button = e.target.closest('.mood-btn');
        const mood = button.dataset.mood;
        addUserMessage(`I'm feeling like a ${mood}/5 ${button.textContent}`);
        appState.currentCheckIn = { date: new Date().toISOString(), mood: parseInt(mood) };
        appState.conversationState = 'awaiting_reason';
        addBotMessage(botResponses.askReason);
        setChatInputMode('text');
        if (chatInput) {
            chatInput.focus();
        }
    }

    async function handleChatSubmit(e) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;
        addUserMessage(text);
        chatInput.value = '';

        if (appState.conversationState === 'awaiting_reason') {
            appState.currentCheckIn.reason = text;
            appState.conversationState = 'awaiting_day_summary';
            addBotMessage(botResponses.askDaySummary);
            chatInput.focus();
        } else if (appState.conversationState === 'awaiting_day_summary') {
            appState.currentCheckIn.daySummary = text;
            setChatInputMode('hidden');
            
            const thinkingMessage = addBotMessage("Clarity is thinking...");
            
            const analysis = await getAIAnalysis(appState.currentCheckIn);
            thinkingMessage.querySelector('p').textContent = analysis;

            const completedHabits = appState.habits.filter(h => h.done).map(h => h.name);
            appState.currentCheckIn.habits = completedHabits;
            appState.currentCheckIn.note = `Reason: ${appState.currentCheckIn.reason}. Day: ${appState.currentCheckIn.daySummary}`;
            appState.checkIns.push(appState.currentCheckIn);
            saveData();
            renderAll();
            
            setTimeout(() => {
                addBotMessage(botResponses.finish.replace('{nickname}', appState.user.nickname));
                resetConversation();
            }, 1500);
        }
    }

    async function getAIAnalysis({ mood, reason, daySummary }) {
        const apiKey = ""; // Canvas will provide the key
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const systemPrompt = "You are Clarity, an empathetic AI companion. Your goal is to help users understand their emotions without being clinical. Analyze the user's input: their mood (1-5), the reason they gave, and a summary of their day. Provide a short, insightful, and supportive paragraph (2-4 sentences). Validate their feelings and gently highlight connections between their day and their mood. Do NOT give medical advice. Your tone should be warm and encouraging, not clinical.";
        const userQuery = `My mood is ${mood}/5. The reason is: "${reason}". My day was about: "${daySummary}".`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error("API Error Response:", await response.text());
                return "I'm having a little trouble gathering my thoughts right now. Please try again later.";
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            return text || "I've reflected on what you said. It's really valuable that you're taking this time for yourself.";

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return "I'm having a little trouble connecting right now. Please check your connection and try again.";
        }
    }


    function handleChatAction(e) {
        if (!e.target.classList.contains('chat-action-btn')) return;
        const action = e.target.dataset.action;
        if (action === 'startBreathing') { addUserMessage("Yes, please."); showBreathingTool(); }
        if (action === 'declineBreathing') { addUserMessage("No, thanks."); addBotMessage("That's perfectly okay."); }
        e.target.parentElement.remove();
    }

    // --- RENDERING FUNCTIONS ---
    function renderAll() {
        renderDashboard();
        renderJournal();
        renderHabits();
        renderMemoryLane();
    }

    function renderDashboard() {
        const last7Days = getLast7DaysData();
        const labels = last7Days.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }));
        const data = last7Days.map(d => d.mood);
        if (moodChart) moodChart.destroy();
        if (moodChartCanvas) {
            moodChart = new Chart(moodChartCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{ label: 'Your Mood', data, borderColor: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.1)', tension: 0.4, fill: true }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true, max: 5 } } }
            });
        }
        const weeklyCheckins = appState.checkIns.filter(ci => (new Date() - new Date(ci.date)) / (1000 * 60 * 60 * 24) <= 7);
        if (weeklyCheckins.length > 0) {
            const avgMood = weeklyCheckins.reduce((sum, ci) => sum + ci.mood, 0) / weeklyCheckins.length;
            const maxMoodEntry = weeklyCheckins.reduce((max, ci) => ci.mood > max.mood ? ci : max, weeklyCheckins[0]);
            weeklySummaryContent.innerHTML = `
                <p>Your average mood this week is <strong class="text-sky-600 text-lg">${avgMood.toFixed(1)}/5</strong>.</p>
                <p>You felt your best on <strong class="text-green-600">${new Date(maxMoodEntry.date).toLocaleDateString()}</strong>.</p>
                <p>You've checked in <strong class="text-sky-600">${weeklyCheckins.length}</strong> times this week. Great job!</p>`;
        } else {
            weeklySummaryContent.innerHTML = `<p>Check-in to see your weekly summary here.</p>`;
        }
    }

    function getLast7DaysData() {
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const checkInForDay = appState.checkIns.find(ci => ci.date.startsWith(dateStr));
            result.push({ date: dateStr, mood: checkInForDay ? checkInForDay.mood : null });
        }
        return result;
    }

    function renderJournal() {
        journalHistory.innerHTML = appState.journal.length === 0 ? '<p class="text-gray-500">Your saved journal entries will appear here.</p>'
            : appState.journal.slice().reverse().map(entry => `
                <div class="bg-sky-50 p-4 rounded-lg border border-sky-200">
                    <p class="font-semibold text-sky-800">${new Date(entry.date).toLocaleString()}</p>
                    <p class="text-gray-700 whitespace-pre-wrap">${entry.entry}</p>
                </div>`).join('');
    }

    function saveJournalEntry() {
        const entry = journalTextarea.value.trim();
        if (!entry) return;
        appState.journal.push({ date: new Date().toISOString(), entry });
        journalTextarea.value = '';
        saveData();
        renderJournal();
    }

    function downloadJournal() {
        if (appState.journal.length === 0) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Your Clarity Journal", 14, 22);
        doc.setFontSize(11);
        const allEntries = appState.journal.map(entry => `Date: ${new Date(entry.date).toLocaleString()}\n\n${entry.entry}`).join('\n\n---\n\n');
        doc.text(doc.splitTextToSize(allEntries, 180), 14, 30);
        doc.save('Clarity_Journal.pdf');
    }

    function renderHabits() {
        habitList.innerHTML = appState.habits.length === 0 ? `<p class="text-gray-500 text-center">No habits added yet.</p>`
            : appState.habits.map(habit => `
                <label class="flex items-center p-4 bg-sky-50 rounded-lg border border-sky-200 cursor-pointer hover:bg-sky-100 transition">
                    <input type="checkbox" class="h-5 w-5 rounded text-sky-600 focus:ring-sky-500" data-habit-name="${habit.name}" ${habit.done ? 'checked' : ''}>
                    <span class="ml-4 text-lg font-medium text-gray-700">${habit.name}</span>
                </label>`).join('');
    }

    function addHabit() {
        const habitName = newHabitInput.value.trim();
        if (habitName && !appState.habits.some(h => h.name.toLowerCase() === habitName.toLowerCase())) {
            appState.habits.push({ name: habitName, done: false });
            newHabitInput.value = '';
            saveData();
            renderHabits();
        }
    }

    function handleHabitToggle(e) {
        if (e.target.type !== 'checkbox') return;
        const habitName = e.target.dataset.habitName;
        const habit = appState.habits.find(h => h.name === habitName);
        if (habit) {
            habit.done = e.target.checked;
            saveData();
        }
    }

    function renderMemoryLane() {
        memoryLaneContent.innerHTML = appState.checkIns.length === 0 ? '<p class="text-gray-500 md:col-span-3 text-center">Your check-ins will create beautiful memory cards here.</p>'
            : appState.checkIns.slice().reverse().map(checkIn => {
                const moodEmojis = { 1: '😞', 2: '😕', 3: '😐', 4: '😊', 5: '😁' };
                const noteToDisplay = checkIn.daySummary || checkIn.reason || "You checked in.";
                return `
                <div class="bg-white p-6 rounded-2xl shadow-lg transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
                    <div class="flex justify-between items-start">
                        <span class="text-5xl">${moodEmojis[checkIn.mood]}</span>
                        <p class="font-semibold text-sky-700">${new Date(checkIn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <p class="mt-4 text-gray-600">You rated your mood a <strong>${checkIn.mood}/5</strong>.</p>
                    <p class="mt-2 text-gray-700 italic">"${noteToDisplay}"</p>
                </div>`
            }).join('');
    }

    // --- BREATHING TOOL & SPEECH RECOGNITION ---
    function showBreathingTool() {
        breathingTool.classList.remove('opacity-0', 'pointer-events-none');
    }
    function hideBreathingTool() {
        breathingTool.classList.add('opacity-0', 'pointer-events-none');
        addBotMessage("Great job taking a moment for yourself. I hope that helped center you.");
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.onstart = () => micBtn.classList.add('bg-red-500', 'text-white');
        recognition.onend = () => micBtn.classList.remove('bg-red-500', 'text-white');
        recognition.onresult = (event) => { journalTextarea.value += event.results[0][0].transcript + '. '; };
        micBtn.addEventListener('click', () => recognition.start());
    } else {
        micBtn.style.display = 'none';
    }

    // --- DATA PERSISTENCE ---
    function saveData() {
        if (appState.user.loggedIn) {
            localStorage.setItem('clarityAppState', JSON.stringify(appState));
        }
    }

    function loadData() {
        const savedState = localStorage.getItem('clarityAppState');
        if (savedState) {
            const loadedState = JSON.parse(savedState);
            const defaultState = { user: {}, checkIns: [], journal: [], habits: [] };
            appState = { ...defaultState, ...loadedState };
        }
        const lastSavedDate = localStorage.getItem('clarityLastDate');
        if (lastSavedDate !== today) {
            if (appState.habits && Array.isArray(appState.habits)) {
                appState.habits.forEach(h => h.done = false);
            }
            localStorage.setItem('clarityLastDate', today);
            saveData();
        }
    }

    // --- START THE APP ---
    init();
});

