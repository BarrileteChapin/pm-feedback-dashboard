/**
 * Feedback Flow - Dashboard Application
 * Client-side JavaScript for kanban board functionality
 */

// API endpoints
const API_BASE = '/api';

// State
let feedbackItems = [];

// DOM Elements
const modalOverlay = document.getElementById('modal-overlay');
const feedbackForm = document.getElementById('feedback-form');
const newFeedbackBtn = document.getElementById('new-feedback-btn');
const seedBtn = document.getElementById('seed-btn');
const logoutBtn = document.getElementById('logout-btn');
const modalClose = document.getElementById('modal-close');
const cancelBtn = document.getElementById('cancel-btn');
const toastContainer = document.getElementById('toast-container');

// Source icons mapping
const sourceIcons = {
    discord: `<svg class="source-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
    github: `<svg class="source-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
    twitter: `<svg class="source-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    email: `<svg class="source-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    support: `<svg class="source-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    manual: `<svg class="source-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
};

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize database
    await initDatabase();

    // Load feedback items
    await loadFeedback();

    // Setup event listeners
    setupEventListeners();

    // Setup drag and drop
    setupDragAndDrop();
});

// Initialize database schema
async function initDatabase() {
    try {
        const response = await fetch(`${API_BASE}/init`, { method: 'POST' });
        const data = await response.json();
        if (!response.ok) {
            console.error('Database init failed:', data);
            showToast('Database initialization failed. Some features may not work.', 'error');
        } else {
            console.log('Database initialized:', data);
        }
    } catch (e) {
        console.error('Failed to initialize database:', e);
    }
}

// Load all feedback items from API
async function loadFeedback() {
    try {
        const response = await fetch(`${API_BASE}/feedback`);
        const data = await response.json();
        feedbackItems = data.feedback || [];
        renderBoard();
        updateStats();
    } catch (error) {
        console.error('Failed to load feedback:', error);
        showToast('Failed to load feedback', 'error');
    }
}

// Render the kanban board
function renderBoard() {
    const columns = ['inbox', 'reviewing', 'planned', 'done'];

    columns.forEach(status => {
        const container = document.getElementById(`${status}-cards`);
        const items = feedbackItems.filter(item => item.status === status);

        // Update column count
        const column = container.closest('.column');
        column.querySelector('.column-count').textContent = items.length;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                    </svg>
                    <p>No items here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => createCardHTML(item)).join('');
    });
}

// Create HTML for a feedback card
function createCardHTML(item) {
    const isProcessing = !item.sentiment && !item.processed_at;
    const themes = Array.isArray(item.themes) ? item.themes : [];

    return `
        <div class="card" draggable="true" data-id="${item.id}">
            <div class="card-header">
                <span class="card-source">
                    ${sourceIcons[item.source] || sourceIcons.manual}
                    ${item.source}
                </span>
                ${item.urgency ? `
                    <span class="card-urgency urgency-${item.urgency}">${item.urgency}</span>
                ` : ''}
            </div>
            ${item.title ? `<h3 class="card-title">${escapeHtml(item.title)}</h3>` : ''}
            <p class="card-content">${escapeHtml(item.summary || item.content)}</p>
            <div class="card-footer">
                ${isProcessing ? `
                    <div class="card-processing">
                        <div class="spinner"></div>
                        Analyzing...
                    </div>
                ` : `
                    <span class="card-sentiment sentiment-${item.sentiment || 'neutral'}">
                        ${getSentimentEmoji(item.sentiment)} ${item.sentiment || 'Pending'}
                    </span>
                    <div class="card-themes">
                        ${themes.slice(0, 2).map(theme => `
                            <span class="theme-tag">${escapeHtml(theme)}</span>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

// Get emoji for sentiment
function getSentimentEmoji(sentiment) {
    switch (sentiment) {
        case 'positive': return '😊';
        case 'negative': return '😟';
        case 'neutral': return '😐';
        default: return '⏳';
    }
}

// Update stats bar
function updateStats() {
    document.getElementById('stat-total').textContent = feedbackItems.length;
    document.getElementById('stat-critical').textContent =
        feedbackItems.filter(item => item.urgency === 'critical').length;
    document.getElementById('stat-negative').textContent =
        feedbackItems.filter(item => item.sentiment === 'negative').length;
    document.getElementById('stat-positive').textContent =
        feedbackItems.filter(item => item.sentiment === 'positive').length;
}

// Setup event listeners
function setupEventListeners() {
    // Open modal
    newFeedbackBtn.addEventListener('click', () => {
        modalOverlay.classList.add('active');
        document.getElementById('content').focus();
    });

    // Close modal
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        feedbackForm.reset();
    };

    modalClose.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // Submit feedback
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(feedbackForm);
        const data = {
            source: formData.get('source'),
            title: formData.get('title') || undefined,
            content: formData.get('content'),
        };

        try {
            const response = await fetch(`${API_BASE}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                showToast('Feedback submitted! AI analysis in progress...', 'success');
                closeModal();
                // Reload after a brief delay to show new item
                setTimeout(loadFeedback, 500);
                // Reload again after analysis may complete
                setTimeout(loadFeedback, 3000);
            } else {
                throw new Error('Failed to submit');
            }
        } catch (error) {
            showToast('Failed to submit feedback', 'error');
        }
    });

    // Seed sample data
    seedBtn.addEventListener('click', async () => {
        seedBtn.disabled = true;
        seedBtn.innerHTML = '<div class="spinner"></div> Loading...';

        try {
            const response = await fetch(`${API_BASE}/seed`, { method: 'POST' });
            if (response.ok) {
                showToast('Sample data loaded! AI analysis in progress...', 'success');
                await loadFeedback();
                // Reload after analysis
                setTimeout(loadFeedback, 5000);
                setTimeout(loadFeedback, 10000);
            } else {
                throw new Error('Failed to seed');
            }
        } catch (error) {
            showToast('Failed to load sample data', 'error');
        } finally {
            seedBtn.disabled = false;
            seedBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    <polyline points="21 3 21 9 15 9"/>
                </svg>
                Load Samples
            `;
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch(`${API_BASE}/logout`, { method: 'POST' });
            window.location.href = '/login';
        } catch (error) {
            showToast('Failed to logout', 'error');
        }
    });
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const board = document.querySelector('.board');

    // Delegate drag events
    board.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('card')) {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
        }
    });

    board.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('card')) {
            e.target.classList.remove('dragging');
        }
    });

    // Column drop zones
    document.querySelectorAll('.column-cards').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');

            const id = e.dataTransfer.getData('text/plain');
            const newStatus = column.closest('.column').dataset.status;

            // Update locally first for instant feedback
            const item = feedbackItems.find(item => item.id === id);
            if (item && item.status !== newStatus) {
                item.status = newStatus;
                renderBoard();
                updateStats();

                // Then update server
                try {
                    await fetch(`${API_BASE}/feedback/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus }),
                    });
                } catch (error) {
                    console.error('Failed to update status:', error);
                    showToast('Failed to update status', 'error');
                    await loadFeedback(); // Revert on failure
                }
            }
        });
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
