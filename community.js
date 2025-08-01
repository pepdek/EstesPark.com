import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    doc, 
    updateDoc,
    increment,
    getDoc,
    where
} from 'firebase/firestore';

class CommunityManager {
    constructor() {
        this.currentUser = null;
        this.posts = [];
        this.init();
    }

    init() {
        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.updateCommunityUI();
        });

        this.setupEventListeners();
        this.loadCommunityPosts();
    }

    setupEventListeners() {
        // Add recommendation button
        const addRecommendationBtn = document.getElementById('addRecommendationBtn');
        if (addRecommendationBtn) {
            addRecommendationBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    this.showAddPostModal();
                } else {
                    // This will trigger the auth modal via the auth-trigger class
                }
            });
        }

        // Vote buttons and favorites
        document.addEventListener('click', (e) => {
            if (e.target.closest('.vote-btn')) {
                this.handleVote(e.target.closest('.vote-btn'));
            }
            
            if (e.target.closest('.favorite')) {
                this.handleFavorite(e.target.closest('.favorite'));
            }
        });
    }

    updateCommunityUI() {
        const addBtn = document.getElementById('addRecommendationBtn');
        if (addBtn) {
            if (this.currentUser) {
                addBtn.innerHTML = '<i class="fas fa-plus"></i> Share a Recommendation';
                addBtn.classList.remove('auth-trigger');
            } else {
                addBtn.innerHTML = '<i class="fas fa-plus"></i> Sign In to Share';
                addBtn.classList.add('auth-trigger');
            }
        }
    }

    showAddPostModal() {
        const modal = this.createAddPostModal();
        document.body.appendChild(modal);
        modal.style.display = 'block';

        // Setup modal event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const submitBtn = modal.querySelector('.submit-btn');
        const form = modal.querySelector('#addPostForm');

        closeBtn.addEventListener('click', () => this.closeModal(modal));
        cancelBtn.addEventListener('click', () => this.closeModal(modal));
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitPost(modal);
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal);
        });
    }

    createAddPostModal() {
        const modal = document.createElement('div');
        modal.className = 'post-modal';
        modal.innerHTML = `
            <div class="post-modal-content">
                <span class="modal-close">&times;</span>
                <h2>Share Your Recommendation</h2>
                <p>Help fellow visitors discover amazing places in Estes Park!</p>
                
                <form id="addPostForm">
                    <div class="form-group">
                        <label for="postTitle">Title *</label>
                        <input type="text" id="postTitle" name="title" placeholder="What's your recommendation?" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="postContent">Description *</label>
                        <textarea id="postContent" name="content" placeholder="Tell us about your experience..." rows="4" required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="postCategory">Category *</label>
                        <select id="postCategory" name="category" required>
                            <option value="">Select a category</option>
                            <option value="lodging">Lodging</option>
                            <option value="dining">Dining</option>
                            <option value="attractions">Attractions</option>
                            <option value="activities">Activities</option>
                            <option value="hidden-gem">Hidden Gem</option>
                            <option value="family">Family-Friendly</option>
                            <option value="romantic">Romantic</option>
                            <option value="budget">Budget-Friendly</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="postTags">Additional Tags (optional)</label>
                        <input type="text" id="postTags" name="tags" placeholder="Separate tags with commas">
                        <small>e.g., breakfast, mountain views, pet-friendly</small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Share Recommendation</button>
                    </div>
                </form>
            </div>
        `;
        return modal;
    }

    closeModal(modal) {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    }

    async submitPost(modal) {
        const form = modal.querySelector('#addPostForm');
        const formData = new FormData(form);
        
        const postData = {
            title: formData.get('title'),
            content: formData.get('content'),
            category: formData.get('category'),
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
            author: {
                uid: this.currentUser.uid,
                displayName: this.currentUser.displayName || 'Anonymous',
                email: this.currentUser.email
            },
            createdAt: new Date(),
            votes: {
                up: 0,
                down: 0,
                userVotes: {} // Store user vote history
            },
            comments: []
        };

        try {
            await addDoc(collection(db, 'communityPosts'), postData);
            this.closeModal(modal);
            this.showMessage('Your recommendation has been shared!', 'success');
            this.loadCommunityPosts(); // Reload posts
        } catch (error) {
            console.error('Error adding post:', error);
            this.showMessage('Failed to share recommendation. Please try again.', 'error');
        }
    }

    async loadCommunityPosts() {
        try {
            const q = query(
                collection(db, 'communityPosts'),
                orderBy('createdAt', 'desc'),
                limit(10)
            );
            
            const querySnapshot = await getDocs(q);
            const communityPosts = document.getElementById('communityPosts');
            
            // Keep the static example posts for now, but add dynamic ones
            let dynamicPostsHTML = '';
            
            querySnapshot.forEach((docSnapshot) => {
                const post = docSnapshot.data();
                const postId = docSnapshot.id;
                
                // Calculate vote score
                const voteScore = (post.votes?.up || 0) - (post.votes?.down || 0);
                const userVote = post.votes?.userVotes?.[this.currentUser?.uid];
                
                dynamicPostsHTML += this.createPostHTML(post, postId, voteScore, userVote);
            });
            
            if (dynamicPostsHTML) {
                // Add dynamic posts after static examples
                const staticPosts = communityPosts.innerHTML;
                communityPosts.innerHTML = dynamicPostsHTML + staticPosts;
            }
            
        } catch (error) {
            console.error('Error loading community posts:', error);
        }
    }

    createPostHTML(post, postId, voteScore, userVote) {
        const tagsHTML = post.tags ? post.tags.map(tag => 
            `<span class="tag ${post.category}">${tag}</span>`
        ).join('') : '';
        
        return `
            <div class="community-post" data-post-id="${postId}">
                <div class="post-header">
                    <div class="post-author">
                        <i class="fas fa-user-circle"></i>
                        <span>${post.author.displayName}</span>
                    </div>
                    <div class="post-date">${this.formatTime(post.createdAt.toDate())}</div>
                </div>
                <div class="post-content">
                    <h4>${post.title}</h4>
                    <p>${post.content}</p>
                    <div class="post-tags">
                        <span class="tag ${post.category}">${this.formatCategory(post.category)}</span>
                        ${tagsHTML}
                    </div>
                </div>
                <div class="post-actions">
                    <button class="vote-btn upvote ${userVote === 'up' ? 'active' : ''}" data-vote="up">
                        <i class="fas fa-chevron-up"></i>
                        <span>${post.votes?.up || 0}</span>
                    </button>
                    <button class="vote-btn downvote ${userVote === 'down' ? 'active' : ''}" data-vote="down">
                        <i class="fas fa-chevron-down"></i>
                        <span>${post.votes?.down || 0}</span>
                    </button>
                    <button class="action-btn favorite ${this.currentUser ? '' : 'auth-trigger'}">
                        <i class="far fa-heart"></i>
                        <span>Save</span>
                    </button>
                    <button class="action-btn comment">
                        <i class="far fa-comment"></i>
                        <span>${post.comments?.length || 0} Comments</span>
                    </button>
                </div>
            </div>
        `;
    }

    async handleVote(voteBtn) {
        if (!this.currentUser) {
            // Trigger auth modal
            document.querySelector('.auth-trigger').click();
            return;
        }

        const postElement = voteBtn.closest('.community-post');
        const postId = postElement.dataset.postId;
        const voteType = voteBtn.dataset.vote;
        
        if (!postId) return; // Skip static posts
        
        try {
            const postRef = doc(db, 'communityPosts', postId);
            const postDoc = await getDoc(postRef);
            const postData = postDoc.data();
            
            const currentUserVote = postData.votes?.userVotes?.[this.currentUser.uid];
            const updateData = {};
            
            if (currentUserVote === voteType) {
                // Remove vote
                updateData[`votes.${voteType}`] = increment(-1);
                updateData[`votes.userVotes.${this.currentUser.uid}`] = null;
            } else {
                // Add or change vote
                if (currentUserVote) {
                    // Change from existing vote
                    updateData[`votes.${currentUserVote}`] = increment(-1);
                }
                updateData[`votes.${voteType}`] = increment(1);
                updateData[`votes.userVotes.${this.currentUser.uid}`] = voteType;
            }
            
            await updateDoc(postRef, updateData);
            this.loadCommunityPosts(); // Reload to show updated votes
            
        } catch (error) {
            console.error('Error updating vote:', error);
            this.showMessage('Failed to update vote', 'error');
        }
    }

    async handleFavorite(favoriteBtn) {
        if (!this.currentUser) {
            return; // Will trigger auth modal via auth-trigger class
        }

        const postElement = favoriteBtn.closest('.community-post');
        const postId = postElement.dataset.postId;
        
        if (!postId) return; // Skip static posts
        
        try {
            // Add to user favorites (implement this when user profile system is ready)
            this.showMessage('Added to favorites!', 'success');
            
            // Update UI
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i><span>Saved</span>';
            favoriteBtn.classList.add('favorited');
            
        } catch (error) {
            console.error('Error adding to favorites:', error);
            this.showMessage('Failed to add to favorites', 'error');
        }
    }

    formatCategory(category) {
        const categoryMap = {
            'lodging': 'Lodging',
            'dining': 'Dining',
            'attractions': 'Attractions',
            'activities': 'Activities',
            'hidden-gem': 'Hidden Gem',
            'family': 'Family-Friendly',
            'romantic': 'Romantic',
            'budget': 'Budget-Friendly'
        };
        return categoryMap[category] || category;
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} min ago`;
        } else if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
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

// Initialize community manager
document.addEventListener('DOMContentLoaded', () => {
    new CommunityManager();
});