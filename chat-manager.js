// Browser-compatible chat manager
// Uses global Firebase objects and standard fetch instead of ES6 imports

class ChatManager {
    constructor() {
        this.currentUser = null;
        this.chatMessages = [];
        this.isTyping = false;
        this.currentChatId = null;
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDb;
        
        // Wait for Firebase to be ready
        if (this.auth) {
            this.init();
        } else {
            setTimeout(() => this.init(), 1000);
        }
    }

    init() {
        if (!this.auth) {
            console.error('Firebase Auth not loaded in ChatManager');
            return;
        }

        console.log('ChatManager initializing...');
        
        // Check authentication status
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.handleAuthChange(user);
        });

        this.setupEventListeners();
        this.autoResizeTextarea();
    }

    handleAuthChange(user) {
        const authOverlay = document.getElementById('authOverlay');
        
        if (user) {
            // User is signed in
            if (authOverlay) authOverlay.style.display = 'none';
            this.loadChatHistory();
            this.loadUserFavorites();
        } else {
            // User is not signed in
            if (authOverlay) authOverlay.style.display = 'flex';
        }
    }

    setupEventListeners() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        const newChatBtn = document.getElementById('newChatBtn');
        const saveChatBtn = document.getElementById('saveChatBtn');

        if (!chatInput || !sendBtn) {
            console.error('Chat elements not found');
            return;
        }

        // Send message events
        sendBtn.addEventListener('click', () => this.sendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Input validation
        chatInput.addEventListener('input', () => {
            const hasText = chatInput.value.trim().length > 0;
            sendBtn.disabled = !hasText || this.isTyping;
        });

        // Quick actions and suggestions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-action') || e.target.classList.contains('suggestion')) {
                const prompt = e.target.dataset.prompt;
                if (prompt) {
                    chatInput.value = prompt;
                    sendBtn.disabled = false;
                    this.sendMessage();
                }
            }
        });

        // Chat management
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.startNewChat());
        }
        if (saveChatBtn) {
            saveChatBtn.addEventListener('click', () => this.saveCurrentChat());
        }
    }

    autoResizeTextarea() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) return;
        
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const messageText = chatInput.value.trim();
        
        if (!messageText || this.isTyping) return;

        // Clear input and disable send button
        chatInput.value = '';
        chatInput.style.height = 'auto';
        document.getElementById('sendBtn').disabled = true;

        // Add user message to chat
        this.addMessage('user', messageText);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Get AI response
            const aiResponse = await this.getAIResponse(messageText);
            
            // Remove typing indicator and add AI response
            this.hideTypingIndicator();
            this.addMessage('ai', aiResponse);
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.addMessage('ai', 'I apologize, but I\'m experiencing some technical difficulties right now. Please try again in a moment, or feel free to browse our website for information about Estes Park lodging, dining, and attractions.');
        }
    }

    async getAIResponse(userMessage) {
        // Call our secure API endpoint
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                chatHistory: this.chatMessages.slice(-10) // Send last 10 messages for context
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to get AI response');
        }

        const data = await response.json();
        return data.response;
    }

    addMessage(sender, text, timestamp = new Date()) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarIcon = sender === 'ai' ? 'fas fa-mountain' : 'fas fa-user';
        const senderName = sender === 'ai' ? 'Estes Park AI Assistant' : (this.currentUser?.displayName || 'You');
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${senderName}</span>
                    <span class="message-time">${this.formatTime(timestamp)}</span>
                </div>
                <div class="message-text">
                    ${this.formatMessageText(text)}
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store message
        this.chatMessages.push({
            sender,
            text,
            timestamp
        });
    }

    formatMessageText(text) {
        // Convert line breaks to HTML
        let formatted = text.replace(/\n/g, '<br>');
        
        // Convert **bold** to <strong>
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        return formatted;
    }

    showTypingIndicator() {
        this.isTyping = true;
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-mountain"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingMessage = document.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} min ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    startNewChat() {
        this.chatMessages = [];
        this.currentChatId = null;
        
        // Clear chat messages except welcome message
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            const messages = chatMessages.querySelectorAll('.message:not(:first-child)');
            messages.forEach(msg => msg.remove());
        }
    }

    async saveCurrentChat() {
        if (!this.currentUser || this.chatMessages.length === 0 || !this.db) return;
        
        try {
            const chatData = {
                userId: this.currentUser.uid,
                messages: this.chatMessages,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                title: this.generateChatTitle()
            };
            
            if (this.currentChatId) {
                // Update existing chat
                await this.db.collection('chats').doc(this.currentChatId).update(chatData);
            } else {
                // Create new chat
                const docRef = await this.db.collection('chats').add(chatData);
                this.currentChatId = docRef.id;
            }
            
            this.showMessage('Chat saved successfully!', 'success');
            this.loadChatHistory();
            
        } catch (error) {
            console.error('Error saving chat:', error);
            this.showMessage('Failed to save chat', 'error');
        }
    }

    generateChatTitle() {
        if (this.chatMessages.length > 0) {
            const firstUserMessage = this.chatMessages.find(msg => msg.sender === 'user');
            if (firstUserMessage) {
                return firstUserMessage.text.substring(0, 50) + (firstUserMessage.text.length > 50 ? '...' : '');
            }
        }
        return 'New Chat';
    }

    async loadChatHistory() {
        // Implementation for loading chat history from Firestore
        console.log('Loading chat history...');
    }

    async loadUserFavorites() {
        // Implementation for loading user favorites
        console.log('Loading user favorites...');
    }

    showMessage(message, type) {
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) existingMessage.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        setTimeout(() => messageDiv.remove(), 5000);
    }
}

// Initialize chat manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ChatManager...');
    window.chatManager = new ChatManager();
});