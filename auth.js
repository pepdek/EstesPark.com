import { auth, googleProvider, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authModal = null;
        this.init();
    }

    init() {
        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.updateUI();
            if (user) {
                this.createUserDocument(user);
            }
        });

        // Create auth modal
        this.createAuthModal();
        this.setupEventListeners();
    }

    createAuthModal() {
        const modalHTML = `
            <div id="authModal" class="auth-modal">
                <div class="auth-modal-content">
                    <span class="auth-close">&times;</span>
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="signin">Sign In</button>
                        <button class="auth-tab" data-tab="signup">Sign Up</button>
                    </div>
                    
                    <div id="signin-form" class="auth-form active">
                        <h2>Welcome Back!</h2>
                        <p>Sign in to access AI chat and save your favorites</p>
                        <form id="signinForm">
                            <input type="email" id="signin-email" placeholder="Email" required>
                            <input type="password" id="signin-password" placeholder="Password" required>
                            <button type="submit" class="auth-btn primary">Sign In</button>
                        </form>
                        <div class="auth-divider">
                            <span>or</span>
                        </div>
                        <button id="googleSignin" class="auth-btn google">
                            <i class="fab fa-google"></i> Continue with Google
                        </button>
                    </div>
                    
                    <div id="signup-form" class="auth-form">
                        <h2>Join Our Community</h2>
                        <p>Create an account to chat with our AI assistant and build your Estes Park itinerary</p>
                        <form id="signupForm">
                            <input type="text" id="signup-name" placeholder="Full Name" required>
                            <input type="email" id="signup-email" placeholder="Email" required>
                            <input type="password" id="signup-password" placeholder="Password (min 6 characters)" required>
                            <button type="submit" class="auth-btn primary">Create Account</button>
                        </form>
                        <div class="auth-divider">
                            <span>or</span>
                        </div>
                        <button id="googleSignup" class="auth-btn google">
                            <i class="fab fa-google"></i> Continue with Google
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.authModal = document.getElementById('authModal');
    }

    setupEventListeners() {
        // Modal controls
        document.querySelector('.auth-close').addEventListener('click', () => this.closeModal());
        document.addEventListener('click', (e) => {
            if (e.target === this.authModal) this.closeModal();
        });

        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Form submissions
        document.getElementById('signinForm').addEventListener('submit', (e) => this.handleSignIn(e));
        document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignUp(e));
        
        // Google auth
        document.getElementById('googleSignin').addEventListener('click', () => this.signInWithGoogle());
        document.getElementById('googleSignup').addEventListener('click', () => this.signInWithGoogle());

        // Sign out button (will be created dynamically)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'signOutBtn') {
                this.signOut();
            }
        });

        // Auth trigger buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-trigger') || e.target.closest('.auth-trigger')) {
                this.openModal();
            }
        });
    }

    switchTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    async handleSignIn(e) {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            this.closeModal();
            this.showMessage('Welcome back!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async handleSignUp(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            this.closeModal();
            this.showMessage('Account created successfully!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async signInWithGoogle() {
        try {
            await signInWithPopup(auth, googleProvider);
            this.closeModal();
            this.showMessage('Welcome!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async signOut() {
        try {
            await signOut(auth);
            this.showMessage('Signed out successfully', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async createUserDocument(user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                displayName: user.displayName || 'Anonymous',
                email: user.email,
                createdAt: new Date(),
                favorites: {
                    lodging: [],
                    dining: [],
                    attractions: []
                },
                itinerary: []
            });
        }
    }

    updateUI() {
        const authButton = document.getElementById('authButton');
        if (this.currentUser) {
            if (authButton) {
                authButton.innerHTML = `
                    <div class="user-menu">
                        <span>Hi, ${this.currentUser.displayName || 'User'}!</span>
                        <div class="user-dropdown">
                            <a href="chat.html">AI Chat</a>
                            <a href="#" id="signOutBtn">Sign Out</a>
                        </div>
                    </div>
                `;
            }
        } else {
            if (authButton) {
                authButton.innerHTML = '<button class="auth-trigger">Sign In</button>';
            }
        }
    }

    openModal() {
        this.authModal.style.display = 'block';
    }

    closeModal() {
        this.authModal.style.display = 'none';
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

    requireAuth(callback) {
        if (this.currentUser) {
            callback();
        } else {
            this.openModal();
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();
export default authManager;