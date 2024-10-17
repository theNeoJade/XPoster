require('dotenv').config();
const axios = require('axios');

async function postToWebhook(message) {
  const webhookURL = process.env.DISCORD_WEBHOOK_URL;

  try {
    await axios.post(webhookURL, { content: message });
    console.log('Message posted to Discord webhook successfully.');
  } catch (error) {
    console.error('Error posting to Discord webhook:', error);
  }
}

module.exports = { postToWebhook };
