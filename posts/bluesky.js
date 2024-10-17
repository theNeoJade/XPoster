require('dotenv').config();
const { BskyAgent } = require('@atproto/api');

async function postSkeet(message) {
  const agent = new BskyAgent({ service: 'https://bsky.social' });

  try {
    await agent.login({
      identifier: process.env.BSKY_IDENTIFIER,
      password: process.env.BSKY_PASSWORD,
    });

    const skeet = await agent.post({ text: message });
    console.log('Skeet posted successfully:', skeet);
  } catch (error) {
    console.error('Error posting skeet:', error);
  }
}

module.exports = { postSkeet };
