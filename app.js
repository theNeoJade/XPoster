require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // Import axios
const { TwitterApi } = require('twitter-api-v2');
const { BskyAgent } = require('@atproto/api');
const { ThreadsAPI } = require('threads-api');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the 'public' directory

// MongoDB connection URI and client setup
const mongoURI = 'mongodb+srv://Jade:gJfUWKDbZhmuGVcl@cluster0.mongodb.net/myDatabase?retryWrites=true&w=majority'; // Replace with your actual MongoDB URI
const client = new MongoClient(mongoURI);
let recentPostsCollection;

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await client.connect();
        recentPostsCollection = client.db('myDatabase').collection('recentPosts'); // Specify your database and collection name
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

// Serve the HTML file for input
app.get('/', async (req, res) => {
    const recentPosts = await getRecentPosts();
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to fetch recent posts
app.get('/recent-posts', async (req, res) => {
    const recentPosts = await getRecentPosts();
    res.json({ posts: recentPosts });
});

// Function to get recent posts from MongoDB
async function getRecentPosts() {
    try {
        return await recentPostsCollection.find().sort({ _id: -1 }).limit(10).toArray();
    } catch (error) {
        console.error('Error fetching recent posts:', error);
        return [];
    }
}

// Twitter credentials
const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Function to post a tweet on Twitter
async function postTweet(message) {
    try {
        const tweet = await twitterClient.v2.tweet(message);
        console.log('Tweet posted successfully:', tweet);
    } catch (error) {
        if (error.code === 403 && error.data.detail.includes('duplicate content')) {
            console.log('Duplicate tweet detected. Skipping tweet post.');
        } else {
            console.error('Error posting tweet:', error);
        }
    }
}

// Bluesky credentials
const BS_identifier = process.env.BSKY_IDENTIFIER;
const BS_password = process.env.BSKY_PASSWORD;

// Function to post a skeet on Bluesky
async function postSkeet(message) {
    const agent = new BskyAgent({
        service: 'https://bsky.social',
    });

    try {
        await agent.login({
            identifier: BS_identifier,
            password: BS_password,
        });

        const skeet = await agent.post({
            text: message,
        });

        console.log('Skeet posted successfully:', skeet);
    } catch (error) {
        console.error('Error posting skeet:', error);
    }
}

// Instagram Threads credentials
const TDS_username = process.env.THREADS_USERNAME;
const TDS_password = process.env.THREADS_PASSWORD;
const deviceID = process.env.THREADS_DEVICE_ID;

// Function to post a thread on Instagram Threads
async function postThread(message) {
    const threadsAPI = new ThreadsAPI({
        username: TDS_username,
        password: TDS_password,
        deviceID: deviceID,  // Provide the device ID
    });

    try {
        await threadsAPI.login();
        const thread = await threadsAPI.publish({
            text: message,
        });

        console.log('Thread posted successfully:', thread);
    } catch (error) {
        console.error('Error posting thread:', error);
    }
}

// Function to post a message to Discord webhook
async function postToWebhook(message) {
    const webhookURL = process.env.DISCORD_WEBHOOK_URL; // Get webhook URL from environment variable

    try {
        await axios.post(webhookURL, {
            content: message, // Sending the message to Discord
        });
        console.log('Message posted to Discord webhook successfully.');
    } catch (error) {
        console.error('Error posting to Discord webhook:', error);
    }
}

// Route to handle form submissions and post the message
app.post('/post', async (req, res) => {
    const message = req.body.message;

    if (!message) {
        return res.send('Message cannot be empty!');
    }

    try {
        await postTweet(message);
        await postSkeet(message);
        await postThread(message);
        await postToWebhook(message); // Post to Discord webhook

        // Store the message in MongoDB
        await recentPostsCollection.insertOne({ message, createdAt: new Date() });

        res.redirect('/'); // Redirect to the homepage to see the updated list
    } catch (error) {
        console.error('Error posting message:', error);
        res.status(500).send('There was an error posting your message. Please try again.');
    }
});

// Start the server and connect to the database
connectToDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}).catch(console.error);
