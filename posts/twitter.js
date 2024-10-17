require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

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

module.exports = { postTweet };
