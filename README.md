# Health & Wellness Blog

This project is a dynamic blog platform focused on health and wellness topics, built using Node.js, Express, and MongoDB. The platform enables content specialists to share their expertise while providing users with a seamless experience for accessing health and fitness information.

## Project Overview

The Health & Wellness Blog serves as a platform where fitness trainers, diet specialists, and mobility experts can share their knowledge through blog posts. The site features both public content accessible to all visitors and protected content available only to authenticated users.

### Core Features

The platform provides comprehensive functionality for both content management and user interaction:

Authentication and Security
- User registration and login system
- Session-based authentication
- Protected routes for authenticated users
- Secure password validation with strength indicators

Content Management
- Create, read, update, and delete (CRUD) blog posts
- Rich text editing for post creation
- Post preview capabilities
- Personal dashboard for content management

User Experience
- Responsive design for all devices
- Intuitive navigation
- Real-time feedback for user actions
- Professional and clean interface

## Technical Implementation

### Backend Technologies
- Node.js with Express framework for server implementation
- MongoDB for database management
- Mongoose for data modeling
- Express-session with connect-mongo for session handling

### Frontend Technologies
- HTML5 for structure
- CSS3 for styling and responsive design
- Vanilla JavaScript for client-side functionality
- Client-side form validation and user feedback

### Database Schema

The application uses two main data models:

User Schema:
```javascript
{
    firstName: String,
    email: String (unique),
    password: String
}
```

Blog Post Schema:
```javascript
{
    title: String,
    content: String,
    author: ObjectId (ref: 'User'),
    createdAt: Date
}
```

## Installation and Setup

1. Prerequisites
   - Node.js installed on your system
   - MongoDB installed and running locally
   - Git for version control

2. Installation Steps
   ```bash
   # Clone the repository
   git clone <repository-url>

   # Navigate to project directory
   cd health-wellness-blog

   # Install dependencies
   npm install

   # Start the server
   node server.js
   ```

3. Environment Setup
   - Ensure MongoDB is running on localhost:27017
   - Configure any environment variables if needed
   - Default port is 3000

## Project Structure

```
health-wellness-blog/
├── public/
│   ├── about.html
│   ├── auth.html
│   ├── contact.html
│   ├── faq.html
│   ├── index.html
│   ├── privacy.html
│   ├── styles.css
│   └── protected/
│       ├── dashboard.html
│       ├── create-post.html
│       └── edit-post.html
├── server.js
├── package.json
└── README.md
```

## Available Routes

Public Routes:
- GET / - Home page
- GET /about.html - About page
- GET /contact.html - Contact page
- GET /faq.html - FAQ page
- GET /privacy.html - Privacy policy
- GET /auth.html - Authentication page

Protected Routes:
- GET /protected/dashboard.html - User dashboard
- GET /protected/create-post.html - Create new post
- GET /protected/edit-post.html - Edit existing post

API Routes:
- POST /api/signup - User registration
- POST /api/login - User authentication
- POST /api/logout - User logout
- GET /api/posts - Fetch user's posts
- POST /api/posts - Create new post
- PUT /api/posts/:id - Update post
- DELETE /api/posts/:id - Delete post

## Security Features

The application implements several security measures:
- Session-based authentication
- Password strength requirements
- Protected routes middleware
- Secure cookie handling
- CSRF protection through SameSite cookies

## Contributing

When contributing to this project:
1. Ensure code follows existing style conventions
2. Add comments for any new, complex functionality
3. Update README documentation as needed
4. Test thoroughly before submitting changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.
