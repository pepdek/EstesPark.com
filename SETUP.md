# EstesPark.com AI Chat & Community System

## Overview

This system adds AI-powered chat functionality and community features to the EstesPark.com website, including:

- 🔐 Firebase Authentication (Email/Password + Google Sign-in)
- 🤖 AI Chat with OpenAI integration (Estes Park visitor center representative)
- 🏘️ Community recommendation system (Reddit-style voting)
- ❤️ Favorites/wishlist system
- 📅 Itinerary planning features
- 📱 Fully responsive design

## Features

### Authentication System
- **Sign-in/Sign-up modal** with email/password and Google authentication
- **Protected routes** - AI chat requires authentication
- **User session management** with persistent login state
- **User profile integration** with Firebase Firestore

### AI Chat System
- **OpenAI GPT-4 integration** with Estes Park-specific knowledge
- **Persistent chat history** stored in Firebase
- **Real-time typing indicators** and smooth UI
- **Quick action buttons** for common questions
- **Chat management** (save, new chat, history)
- **Mobile-responsive design**

### Community Features
- **Reddit-style voting system** with upvote/downvote functionality
- **User-generated recommendations** with categories and tags
- **Real-time updates** using Firebase Firestore
- **Content moderation** through Firebase security rules
- **Mobile-optimized interface**

## File Structure

```
EstesPark.com/
├── index.html              # Main homepage with community section
├── chat.html              # AI chat page (protected)
├── firebase-config.js     # Firebase configuration and initialization
├── auth.js               # Authentication system and modals
├── chat.js               # AI chat functionality and OpenAI integration
├── community.js          # Community features and voting system
├── firebase-init.js      # Database structure and sample data
├── styles.css           # Main styles (includes community styles)
├── auth-styles.css      # Authentication modal styles
├── chat-styles.css      # AI chat page styles
├── script.js           # Enhanced navigation handling
├── logo-manager.js     # Existing logo management
└── SETUP.md           # This setup guide
```

## Setup Instructions

### 1. Firebase Configuration

The Firebase project is already configured:
- **Project ID**: estespark-83a46
- **API Key**: AIzaSyCfCRvUPmCEXhXleJG0nHM3BXQpSEowjq8
- **Auth Domain**: estespark-83a46.firebaseapp.com

### 2. Firebase Authentication Setup

In the Firebase Console (https://console.firebase.google.com/):

1. Go to Authentication > Sign-in method
2. Enable **Email/Password** authentication
3. Enable **Google** authentication
   - Add your domain to authorized domains
4. Configure OAuth redirect domains for your hosting

### 3. Firestore Database Setup

1. Go to Firestore Database in Firebase Console
2. Create database in production mode
3. Set up security rules (copy from `firebase-init.js`)
4. Initialize sample data by running:
   ```javascript
   import { initializeSampleData } from './firebase-init.js';
   initializeSampleData();
   ```

### 4. OpenAI API Configuration

Set up your OpenAI API key as an environment variable:
- **Environment Variable**: `OPENAI_API_KEY=your-actual-api-key-here`
- **Model**: GPT-4
- **Context**: Specialized Estes Park visitor center representative

For local development, create a `.env` file:
```
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

For production deployment, set the environment variable in your hosting platform.

### 5. Hosting Setup

#### Option A: Vercel Deployment (Recommended)

1. **Connect to GitHub**:
   - Push your code to GitHub
   - Connect your GitHub repository to Vercel
   - Import your project at https://vercel.com

2. **Environment Variables**:
   Set these in Vercel dashboard:
   ```
   OPENAI_API_KEY=your-actual-openai-api-key
   ```

3. **Deploy**:
   - Vercel will automatically deploy from your main branch
   - The `vercel.json` configuration is already set up
   - API endpoints are handled as serverless functions

#### Option B: Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Configure `firebase.json`:
   ```json
   {
     "hosting": {
       "public": ".",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```
5. Deploy: `firebase deploy`

**Note**: For Firebase Hosting, you'll need to set up Firebase Functions for the OpenAI API endpoint.

## Usage Guide

### For Visitors

1. **Browse the website** - No authentication required for browsing
2. **Sign up/Sign in** - Click the sign-in button in the navigation
3. **AI Chat** - Access the AI chat after signing in to get personalized recommendations
4. **Community** - Share recommendations and vote on others' suggestions
5. **Favorites** - Save favorite places and build your itinerary

### For Administrators

1. **Monitor usage** through Firebase Console Analytics
2. **Moderate content** through Firestore Console
3. **Manage users** through Firebase Authentication
4. **Update AI knowledge** by modifying the system prompt in `chat.js`

## Database Structure

### Collections

1. **users** - User profiles and preferences
2. **communityPosts** - User recommendations and votes
3. **chats** - AI chat history and sessions
4. **favorites** - User-saved items with metadata
5. **itineraries** - User travel plans and schedules

### Security Rules

- Users can only access their own data
- Community posts are public for reading, authenticated for writing
- Voting system prevents duplicate votes per user
- Chat history is private to each user

## API Integration

### OpenAI Chat Completion

The AI assistant uses OpenAI's GPT-4 with a specialized system prompt that:
- Only references EstesPark.com information
- Never mentions visitestespark.com
- Provides personalized recommendations
- Maintains conversation context
- Offers specific local knowledge

### Firebase Firestore

Real-time database operations for:
- User authentication state
- Community post voting
- Chat message persistence
- Favorites management
- Itinerary planning

## Mobile Responsiveness

The system is fully responsive with:
- Mobile-optimized authentication modals
- Touch-friendly voting buttons
- Responsive chat interface
- Collapsible navigation on mobile
- Optimized forms and inputs

## Security Features

- **Input validation** on all forms
- **XSS protection** through proper escaping
- **Firebase security rules** prevent unauthorized access
- **API key protection** through environment configuration
- **Rate limiting** through Firebase quotas

## Performance Optimization

- **Lazy loading** of community posts
- **Caching** of chat history
- **Optimized images** and assets
- **Minimal JavaScript bundles**
- **CDN delivery** through Firebase Hosting

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check Firebase project configuration
   - Verify authorized domains in Firebase Console
   - Ensure proper HTTPS setup

2. **AI Chat not responding**
   - Verify OpenAI API key is valid
   - Check browser console for errors
   - Ensure user is authenticated

3. **Community voting not working**
   - Check Firestore security rules
   - Verify user authentication status
   - Check browser network tab for API errors

4. **Mobile responsiveness issues**
   - Test on multiple devices
   - Check CSS media queries
   - Verify touch event handling

## Future Enhancements

- Push notifications for new community posts
- Advanced itinerary sharing features
- Integration with booking systems
- Multi-language support
- Advanced search and filtering
- User reputation system
- Content moderation tools

## Support

For technical issues:
1. Check browser console for errors
2. Verify Firebase project status
3. Test API endpoints manually
4. Review security rules and permissions

## License

This system is proprietary to EstesPark.com and includes integrations with:
- Firebase (Google Cloud Platform)
- OpenAI API
- Font Awesome icons
- Google Fonts