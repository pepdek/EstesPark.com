import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';

class ChatManager {
    constructor() {
        this.currentUser = null;
        this.chatMessages = [];
        this.isTyping = false;
        this.currentChatId = null;
        
        // AI chat functionality - API calls handled securely via server endpoint
        
        this.init();
    }

    init() {
        // Check authentication status
        onAuthStateChanged(auth, (user) => {
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
            authOverlay.style.display = 'none';
            this.loadChatHistory();
            this.loadUserFavorites();
        } else {
            // User is not signed in
            authOverlay.style.display = 'flex';
        }
    }

    setupEventListeners() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        const newChatBtn = document.getElementById('newChatBtn');
        const saveChatBtn = document.getElementById('saveChatBtn');

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
        newChatBtn.addEventListener('click', () => this.startNewChat());
        saveChatBtn.addEventListener('click', () => this.saveCurrentChat());
    }

    autoResizeTextarea() {
        const chatInput = document.getElementById('chatInput');
        
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
        // Call our secure API endpoint instead of OpenAI directly
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
        
        // Convert bullet points
        formatted = formatted.replace(/^[•\-\*]\s/gm, '<li>');
        
        return formatted;
    }

    showTypingIndicator() {
        this.isTyping = true;
        const chatMessages = document.getElementById('chatMessages');
        
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

    async saveCurrentChat() {
        if (!this.currentUser || this.chatMessages.length === 0) return;
        
        try {
            const chatData = {
                userId: this.currentUser.uid,
                messages: this.chatMessages,
                createdAt: new Date(),
                title: this.generateChatTitle()
            };
            
            if (this.currentChatId) {
                // Update existing chat
                await updateDoc(doc(db, 'chats', this.currentChatId), chatData);
            } else {
                // Create new chat
                const docRef = await addDoc(collection(db, 'chats'), chatData);
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

    startNewChat() {
        this.chatMessages = [];
        this.currentChatId = null;
        
        // Clear chat messages except welcome message
        const chatMessages = document.getElementById('chatMessages');
        const messages = chatMessages.querySelectorAll('.message:not(:first-child)');
        messages.forEach(msg => msg.remove());
    }

    async loadChatHistory() {
        if (!this.currentUser) return;
        
        try {
            const q = query(
                collection(db, 'chats'),
                orderBy('createdAt', 'desc'),
                limit(10)
            );
            
            const querySnapshot = await getDocs(q);
            const chatHistory = document.getElementById('chatHistory');
            chatHistory.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const chat = doc.data();
                const chatItem = document.createElement('div');
                chatItem.className = 'chat-history-item';
                chatItem.innerHTML = `
                    <div class="chat-title">${chat.title}</div>
                    <div class="chat-date">${this.formatTime(chat.createdAt.toDate())}</div>
                `;
                
                chatItem.addEventListener('click', () => {
                    this.loadChat(doc.id, chat);
                });
                
                chatHistory.appendChild(chatItem);
            });
            
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    loadChat(chatId, chatData) {
        this.currentChatId = chatId;
        this.chatMessages = chatData.messages || [];
        
        // Clear current messages except welcome
        const chatMessages = document.getElementById('chatMessages');
        const messages = chatMessages.querySelectorAll('.message:not(:first-child)');
        messages.forEach(msg => msg.remove());
        
        // Load chat messages
        this.chatMessages.forEach(msg => {
            this.addMessage(msg.sender, msg.text, msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp));
        });
    }

    async loadUserFavorites() {
        // This will be implemented when favorites system is created
        const favoritesDiv = document.getElementById('userFavorites');
        favoritesDiv.innerHTML = '<p class="no-favorites">Your favorites will appear here!</p>';
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
    new ChatManager();
});