# charlie-chat-app

This repository provides a robust and scalable API foundation for a real-time chat application. It enables users to:

1. Register and Log In: Securely create new accounts and authenticate existing users.
2. Create Posts: Share text, images, or other media content.
3. Comment on Posts: Engage in discussions and express opinions on posts.
4. Follow Users: Stay updated on the activities of people you're interested in.
   
Key Features:

1. RESTful API: Designed for ease of integration with various frontend frameworks.
2. Authentication: Ensures secure user access with JWT-based token authentication.
3. Authorization: Implements appropriate access controls for different user roles.
4. Database Integration: Leverages a database (like MongoDB) for efficient data storage and retrieval.

Getting Started:

1. Clone the Repository: Use git clone https://github.com/charlesdev96/charlie-chat-app.git to clone this repository.
2. Install Dependencies: Run npm install in the project directory to install the required dependencies.
3. Configure Database: Create a database connection using your preferred database technology (e.g., MongoDB) and update the configuration details in the appropriate environment variables file.
4. Start the Server: Run npm start to start the API server.
   
API Endpoints:
**NOTE**: Most API endpoints in this project require authentication. This means you'll need a token to access information about the currently logged-in user or perform actions on their behalf. Endpoints like registration and login are exempt from this requirement.
If you attempt to access a protected endpoint without a valid token, you'll receive an error message prompting you to log in. For easy token management in Postman, you can leverage the "Authorization" header with the "Bearer Token" scheme. Simply copy and paste your access token, which is automatically retrieved upon successful login and stored as accessToken in your code.
I've implemented a code that automatically copies the token from the login when "Bearer Token" is clicked, and I've named it "accessToken". You can do this by:
in login, click on Test and paste this code:
const jsonData = pm.response.json()
pm.globals.set("accessToken", jsonData.token)

URL = http://localhost:5000/api/v1

A. User Registration and Login:
  1. Creates a new user account:(POST) URL/auth/register.
  2. User Login: URL/auth/login

B. File Upload Link (requires authentication).
  Upload files(videos, image, pdf etc): URL/file-upload

C. User information (requires authentication).
  1. Update user account/profile: URL/user/update-account
  2. Delete user account: These have two phases
     (a) Get user account: URL/user/delete-account
     (b) Confirm account to be deleted: URL/user/confirm-account
  3. Get current user profile: URL/user/display-account
  4. Get single user: URL/user/get-single-user/userId
  5. Search for user using username or phone number(also allow partial search): URL/user/search-user?username or URL/user/search-user?phonenumber

D. User connections(Followings) (requires authentication).
  1. Follow a user: URL/user/follow-user/userId
  2. Unfollow a user: URL/user/unfollow-user/userId
  3. Get current user followers: URL/user/get-followers
  4. Get current user followings: URL/user/get-followings

E. User Posts (requires authentication).
  1. Create Post: URL/post/create-post
  2. Update Post: URL/post/update-post/postId
  3. Delete Post: URL/post/delete-post/postId
  4. Get single post: URL/post/get-post/postId
  5. Like a post: URL/post/like-post/postId
  6. Dislike a post: URL/post/unlike-post/postId
  7. Get Time line post(Like to get all posts): URL/post/time-line-post
  8. Search for posts using desc: URL/post/search-post?desc=search

F. Comments on Posts
  1. Create comment on a post: URL/comment/create-comment/postId
  2. Update comment: URL/comment/update-comment/commentId
  3. Delete comment: URL/comment/delete-comment/commentId

NOTE:
A sample of how i called the endpoints in postman can be seen using the link below and there is an example template for each endpoint.
Postman link: https://www.postman.com/charles4christ/workspace/my-projects/collection/23276713-f0987222-2f70-462c-8f29-f04a68beaf65?action=share&creator=23276713

This will provide you with insights into how the endpoints were utilized in Postman, along with templates that you can use for reference or testing purposes.

Future Enhancements:
Real-time Chat: Integration with a real-time messaging service for instant communication.
Group Chat: Enable communication within groups of users.
Push Notifications: Implement push notifications to alert users about new messages and activities.
