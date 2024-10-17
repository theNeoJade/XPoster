require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const { postTweet } = require('./posts/twitter');
const { postSkeet } = require('./posts/bluesky');
const { postThread } = require('./posts/threads');
const { postToWebhook } = require('./posts/discord');

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

const recentPostSchema = new mongoose.Schema({
  message: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
});

const RecentPost = mongoose.model(
  'RecentPost',
  recentPostSchema,
  'recentposts'
);

const app = express();
const port = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('uploads'));

app.get('/', (req, res) => {
  res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Post to Social Media</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #181818; /* Dark background */
                    color: #ffffff; /* White text color */
                }
                form {
                    margin: 50px auto;
                    max-width: 500px;
                    background: rgba(255, 255, 255, 0.1); /* Slightly transparent background for the form */
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); /* Shadow for form */
                }
                textarea {
                    width: 100%;
                    max-width: 400px;
                    border-radius: 5px;
                    padding: 10px;
                    border: none;
                    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3);
                }
                button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    background-color: #6200ea; /* Button color */
                    color: white;
                    cursor: pointer;
                    transition: background-color 0.3s;
                    margin-top: 10px; /* Add margin above the button */
                }
                button:hover {
                    background-color: #3700b3; /* Darker button color on hover */
                }
                .recent-posts {
                    margin-top: 30px;
                }
                .post {
                    border: 1px solid #333; /* Border color for posts */
                    background: rgba(255, 255, 255, 0.1); /* Slightly transparent background for posts */
                    padding: 10px;
                    margin: 10px auto;
                    max-width: 400px;
                    border-radius: 5px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5); /* Shadow for posts */
                }
                img {
                    max-width: 100%; /* Ensure images are responsive */
                    height: auto;
                }
            </style>
        </head>
        <body>
            <form action="/post" method="POST" enctype="multipart/form-data">
                <label for="message">Enter your message:</label><br/>
                <textarea id="message" name="message" rows="4"></textarea><br/>
                <input type="file" name="image" accept="image/*"/><br/><br/>
                <button type="submit">Post to Twitter, Bluesky, Threads, and Discord</button>
            </form>
            <div class="recent-posts">
                <h3>Recently Posted Messages:</h3>
                <div id="recentPosts"></div>
            </div>

            <script>
                // Fetch recent posts on page load
                fetch('/recent-posts')
                    .then(response => response.json())
                    .then(data => {
                        const recentPostsDiv = document.getElementById('recentPosts');
                        data.posts.forEach(post => {
                            const postDiv = document.createElement('div');
                            postDiv.className = 'post';
                            postDiv.innerText = post.message;
                            if (post.image) {
                                const img = document.createElement('img');
                                img.src = post.image; // Set image source
                                postDiv.appendChild(img);
                            }
                            recentPostsDiv.appendChild(postDiv);
                        });
                    });
            </script>
        </body>
        </html>
    `);
});

app.get('/recent-posts', async (req, res) => {
  try {
    const posts = await RecentPost.find().sort({ createdAt: -1 }).limit(10);
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching recent posts:', error);
    res.status(500).send('Error fetching recent posts');
  }
});

app.post('/post', upload.single('image'), async (req, res) => {
  const message = req.body.message;
  const imagePath = req.file ? `/${req.file.path}` : null;

  if (!message && !imagePath) {
    return res.send('Message cannot be empty and no image uploaded!');
  }

  try {
    await postTweet(message, imagePath);
    await postSkeet(message, imagePath);
    await postThread(message, imagePath);
    await postToWebhook(message, imagePath);

    const newPost = new RecentPost({ message, image: imagePath });
    await newPost.save();

    res.redirect('/');
  } catch (error) {
    console.error('Error posting message:', error);
    res
      .status(500)
      .send('There was an error posting your message. Please try again.');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
