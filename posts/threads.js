require('dotenv').config();
const { ThreadsAPI } = require('threads-api');

async function postThread(message) {
  const threadsAPI = new ThreadsAPI({
    username: process.env.THREADS_USERNAME,
    password: process.env.THREADS_PASSWORD,
    deviceID: process.env.THREADS_DEVICE_ID,
  });

  try {
    await threadsAPI.login();
    const thread = await threadsAPI.publish({ text: message });
    console.log('Thread posted successfully:', thread);
  } catch (error) {
    console.error('Error posting thread:', error);
  }
}

module.exports = { postThread };
