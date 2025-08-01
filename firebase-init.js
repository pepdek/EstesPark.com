import { db } from './firebase-config.js';
import { doc, setDoc, collection } from 'firebase/firestore';

// Firebase Firestore Database Structure
const databaseStructure = {
    // Users collection - stores user profiles and preferences
    users: {
        // Document ID: user.uid
        displayName: 'string',
        email: 'string',
        createdAt: 'timestamp',
        favorites: {
            lodging: [], // Array of lodging IDs or names
            dining: [], // Array of restaurant IDs or names
            attractions: [] // Array of attraction IDs or names
        },
        itinerary: [], // Array of itinerary items
        preferences: {
            budgetRange: 'string', // 'budget', 'mid-range', 'luxury'
            travelStyle: 'string', // 'family', 'romantic', 'adventure', 'relaxation'
            interests: [] // Array of interests
        }
    },

    // Community Posts collection - stores user recommendations
    communityPosts: {
        // Document ID: auto-generated
        title: 'string',
        content: 'string',
        category: 'string', // 'lodging', 'dining', 'attractions', 'activities'
        tags: [], // Array of strings
        author: {
            uid: 'string',
            displayName: 'string',
            email: 'string'
        },
        createdAt: 'timestamp',
        votes: {
            up: 'number',
            down: 'number',
            userVotes: {} // Object mapping user UIDs to vote type ('up'/'down')
        },
        comments: [] // Array of comment objects
    },

    // Chat Sessions collection - stores AI chat history
    chats: {
        // Document ID: auto-generated
        userId: 'string',
        title: 'string',
        messages: [], // Array of message objects
        createdAt: 'timestamp',
        updatedAt: 'timestamp'
    },

    // Favorites collection - stores user favorites with additional metadata
    favorites: {
        // Document ID: auto-generated
        userId: 'string',
        itemType: 'string', // 'lodging', 'dining', 'attraction'
        itemName: 'string',
        itemDetails: {}, // Object containing item-specific details
        addedAt: 'timestamp',
        notes: 'string' // User's personal notes
    },

    // Itineraries collection - stores user travel plans
    itineraries: {
        // Document ID: auto-generated
        userId: 'string',
        name: 'string',
        description: 'string',
        startDate: 'timestamp',
        endDate: 'timestamp',
        items: [], // Array of itinerary items
        createdAt: 'timestamp',
        isPublic: 'boolean'
    }
};

// Security Rules Documentation
const securityRules = `
// Firestore Security Rules for EstesPark.com

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Community posts are readable by all, writable by authenticated users
    match /communityPosts/{postId} {
      allow read: if true;
      allow create: if request.auth != null 
        && request.auth.uid == resource.data.author.uid;
      allow update: if request.auth != null 
        && (request.auth.uid == resource.data.author.uid 
            || onlyUpdatingVotes());
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.author.uid;
    }
    
    // Chat sessions are private to each user
    match /chats/{chatId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // Favorites are private to each user
    match /favorites/{favoriteId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // Itineraries - users can manage their own, read public ones
    match /itineraries/{itineraryId} {
      allow read: if resource.data.isPublic == true 
        || (request.auth != null && request.auth.uid == resource.data.userId);
      allow write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // Helper function to check if only votes are being updated
    function onlyUpdatingVotes() {
      return request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['votes']);
    }
  }
}
`;

// Initialize sample data for testing
export async function initializeSampleData() {
    try {
        console.log('Initializing sample community posts...');
        
        // Sample community posts
        const samplePosts = [
            {
                title: "Best breakfast spot with mountain views",
                content: "Notchtop Bakery & Cafe has incredible fresh pastries and the outdoor seating offers amazing views of the mountains. Perfect way to start your day before heading into Rocky Mountain National Park!",
                category: "dining",
                tags: ["breakfast", "mountain views", "bakery"],
                author: {
                    uid: "sample-user-1",
                    displayName: "Mountain Explorer",
                    email: "explorer@example.com"
                },
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                votes: {
                    up: 15,
                    down: 1,
                    userVotes: {}
                },
                comments: []
            },
            {
                title: "Family-friendly cabin recommendation",
                content: "The Evergreens on Fall River was perfect for our family of 5. Kids loved being so close to the river, and it's only 1.5 miles from Rocky Mountain National Park entrance. Clean, spacious, and great value!",
                category: "lodging",
                tags: ["family-friendly", "river access", "cabins"],
                author: {
                    uid: "sample-user-2",
                    displayName: "Family Traveler",
                    email: "family@example.com"
                },
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                votes: {
                    up: 12,
                    down: 0,
                    userVotes: {}
                },
                comments: []
            }
        ];

        // Add sample posts to Firestore
        for (const post of samplePosts) {
            await setDoc(doc(collection(db, 'communityPosts')), post);
        }
        
        console.log('Sample data initialized successfully!');
        return { success: true };
        
    } catch (error) {
        console.error('Error initializing sample data:', error);
        return { success: false, error };
    }
}

// Export database structure for reference
export { databaseStructure, securityRules };

console.log('Firebase Database Structure:');
console.log(JSON.stringify(databaseStructure, null, 2));
console.log('\nSecurity Rules:');
console.log(securityRules);