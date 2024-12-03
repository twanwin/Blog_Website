const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');  // Add this for MongoDB session storage
const path = require('path');
const app = express();
const port = 3000;

// Enhanced session configuration with MongoDB store for persistence
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/blog_website',
        ttl: 24 * 60 * 60, // Session TTL (time to live) in seconds
        autoRemove: 'native' // Let MongoDB handle the removal of expired sessions
    }),
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,  // 24 hours in milliseconds
        httpOnly: true,                // Prevents client-side access to the cookie
        secure: false,                 // Set to true if using HTTPS
        sameSite: 'strict'            // Protects against CSRF attacks
    }
}));

// Session debugging middleware to track session state
app.use((req, res, next) => {
    console.log('Session Debug Info:');
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
    console.log('Is Authenticated:', !!req.session.user);
    next();
});

// Basic middleware setup
app.use(express.static('public'));
app.use(express.json());

// Authentication middleware with enhanced logging
const requireAuth = (req, res, next) => {
    console.log('Auth Check - Session State:', {
        sessionExists: !!req.session,
        hasUser: !!req.session.user,
        userId: req.session.user?.id
    });

    if (!req.session.user) {
        console.log('Authentication Failed - No session user');
        return res.status(401).json({ message: 'Please log in to access this page' });
    }
    console.log('Authentication Successful - User:', req.session.user.firstName);
    next();
};

// Protected route handler for authenticated content
app.get('/protected/*', requireAuth, (req, res, next) => {
    console.log('Accessing Protected Route:', req.path);
    const filePath = path.join(__dirname, 'public', req.path.replace('/protected', ''));
    res.sendFile(filePath);
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/blog_website')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// User Schema and Model
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', userSchema);

// Blog Post Schema and Model
const blogPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

// Session debugging endpoint
app.get('/api/session-debug', (req, res) => {
    console.log('Session Debug Request');
    console.log('Full session object:', req.session);
    console.log('Session ID:', req.sessionID);
    console.log('User data:', req.session.user);
    
    res.json({
        sessionExists: !!req.session,
        isAuthenticated: !!req.session.user,
        sessionID: req.sessionID,
        userData: req.session.user || null,
        cookieSettings: req.session.cookie
    });
});

// Authentication status check endpoint
app.get('/api/check-auth', (req, res) => {
    console.log('Checking Authentication Status');
    console.log('Session exists:', !!req.session);
    console.log('User in session:', req.session.user);

    if (req.session.user) {
        console.log('User is authenticated:', req.session.user.firstName);
        res.json({ 
            isLoggedIn: true, 
            firstName: req.session.user.firstName 
        });
    } else {
        console.log('No authenticated user found');
        res.json({ isLoggedIn: false });
    }
});

// User signup endpoint
app.post('/api/signup', async (req, res) => {
    console.log('Processing Signup Request');
    try {
        const { firstName, email, password } = req.body;
        console.log('Signup attempt for:', email);
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Signup failed: User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ firstName, email, password });
        await user.save();
        console.log('New user created:', user._id);
        
        res.json({ message: 'Signup successful' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Enhanced login endpoint with session handling
app.post('/api/login', async (req, res) => {
    console.log('Processing Login Request');
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);
        
        const user = await User.findOne({ email, password });
        if (!user) {
            console.log('Login failed: Invalid credentials');
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Set user info in session
        req.session.user = {
            id: user._id,
            email: user.email,
            firstName: user.firstName
        };

        // Explicitly save session to ensure it's stored
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ message: 'Error saving session' });
            }
            
            console.log('Login successful for:', user.firstName);
            console.log('Session ID:', req.sessionID);
            console.log('Session data:', req.session);
            
            res.json({ 
                message: 'Login successful',
                redirectUrl: '/protected/dashboard.html',
                firstName: user.firstName
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Enhanced logout endpoint with proper session cleanup
app.post('/api/logout', (req, res) => {
    console.log('Processing Logout Request');
    console.log('Current session ID:', req.sessionID);
    
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ message: 'Error logging out' });
        }
        console.log('Session destroyed successfully');
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

// Create new blog post endpoint
app.post('/api/posts', requireAuth, async (req, res) => {
    console.log('Creating new blog post');
    try {
        const { title, content } = req.body;
        console.log('Post author:', req.session.user.id);
        
        const post = new BlogPost({
            title,
            content,
            author: req.session.user.id
        });

        await post.save();
        console.log('New post created:', post._id);
        res.json({ message: 'Post created successfully', post });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Error creating post' });
    }
});

// Get all posts for logged-in user
app.get('/api/posts', requireAuth, async (req, res) => {
    console.log('Fetching posts for user:', req.session.user.id);
    try {
        const posts = await BlogPost.find({ author: req.session.user.id })
            .sort({ createdAt: -1 });
        console.log('Found posts:', posts.length);
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts' });
    }
});

// Get a single post for editing
app.get('/api/posts/:id', requireAuth, async (req, res) => {
    console.log('Fetching single post:', req.params.id);
    try {
        const post = await BlogPost.findOne({
            _id: req.params.id,
            author: req.session.user.id
        });

        if (!post) {
            console.log('Post not found or unauthorized');
            return res.status(404).json({ message: 'Post not found or unauthorized' });
        }

        console.log('Post found:', post._id);
        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'Error fetching post' });
    }
});

// Update post endpoint
app.put('/api/posts/:id', requireAuth, async (req, res) => {
    console.log('Updating post:', req.params.id);
    try {
        const { title, content } = req.body;
        const postId = req.params.id;

        const post = await BlogPost.findOne({ 
            _id: postId, 
            author: req.session.user.id 
        });

        if (!post) {
            console.log('Post not found or unauthorized');
            return res.status(404).json({ message: 'Post not found or unauthorized' });
        }

        const updatedPost = await BlogPost.findByIdAndUpdate(
            postId,
            { title, content },
            { new: true }
        );

        console.log('Post updated successfully:', postId);
        res.json({ message: 'Post updated successfully', post: updatedPost });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Error updating post' });
    }
});

// Get all public posts
app.get('/api/public-posts', async (req, res) => {
    console.log('Fetching all public posts');
    try {
        const posts = await BlogPost.find()
            .sort({ createdAt: -1 })
            .populate('author', 'firstName');
            
        console.log('Found public posts:', posts.length);
        res.json(posts);
    } catch (error) {
        console.error('Error fetching public posts:', error);
        res.status(500).json({ message: 'Error fetching posts' });
    }
});

// Get single public post with debug logging
app.get('/api/public-posts/:id', async (req, res) => {
    console.log('Fetching public post:', req.params.id);
    try {
        const post = await BlogPost.findById(req.params.id)
            .populate('author', 'firstName');
            
        if (!post) {
            console.log('Public post not found');
            return res.status(404).json({ message: 'Post not found' });
        }
        
        console.log('Public post found:', post._id);
        res.json(post);
    } catch (error) {
        console.error('Error fetching public post:', error);
        res.status(500).json({ message: 'Error fetching post' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});