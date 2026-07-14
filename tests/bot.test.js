// Set test environment variables before imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = 'src/database/jokes_test.db';
process.env.ON_EXHAUSTION = 'reset';
process.env.LOG_LEVEL = 'error'; // mute logs during testing

// Mock @atproto/api to prevent Jest from loading the ESM package directly and throwing SyntaxError
jest.mock('@atproto/api', () => {
  return {
    BskyAgent: jest.fn().mockImplementation(() => {
      return {
        login: jest.fn().mockResolvedValue({}),
        post: jest.fn().mockResolvedValue({
          uri: 'mock_uri',
          cid: 'mock_cid'
        })
      };
    })
  };
});

const path = require('path');
const fs = require('fs');
const request = require('supertest');
const db = require('../src/config/db');
const jokeRepository = require('../src/repository/jokeRepository');
const jokeService = require('../src/services/jokeService');
const postingService = require('../src/services/twitterService');
const bluesky = require('../src/config/bluesky');
const app = require('../src/app');

// Clean up the test database after all tests
afterAll(async () => {
  await db.close();
  const testDbPath = path.resolve(process.env.DATABASE_PATH);
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (err) {
      // ignore unlink errors
    }
  }
});

beforeAll(async () => {
  // Ensure test database is initialized
  await db.connect();
  // Initialize bluesky (will go into mock mode since no credentials)
  await bluesky.initialize();
});

describe('Database & Repository Tests', () => {
  beforeEach(async () => {
    // Clear tables before each test
    await db.run('DELETE FROM jokes');
    await db.run('DELETE FROM tweet_logs');
  });

  test('Should insert and retrieve counts of jokes', async () => {
    await jokeRepository.insertJoke('Why did the chicken cross the road?', 'Animals');
    await jokeRepository.insertJoke('Why Java?', 'Programming');
    
    const counts = await jokeRepository.getCounts();
    expect(counts.total).toBe(2);
    expect(counts.pending).toBe(2);
    expect(counts.posted).toBe(0);
  });

  test('Should select next pending joke and update status', async () => {
    const jokeId = await jokeRepository.insertJoke('Why Java?', 'Programming');
    
    const nextJoke = await jokeService.selectNextJoke();
    expect(nextJoke).not.toBeNull();
    expect(nextJoke.id).toBe(jokeId);
    expect(nextJoke.status).toBe('Pending');

    await jokeService.lockJoke(jokeId);
    let counts = await jokeRepository.getCounts();
    expect(counts.locked).toBe(1);

    await jokeService.markAsPosted(jokeId);
    counts = await jokeRepository.getCounts();
    expect(counts.posted).toBe(1);
    expect(counts.locked).toBe(0);
  });

  test('Should handle exhaustion strategy "reset"', async () => {
    process.env.ON_EXHAUSTION = 'reset';
    const jokeId = await jokeRepository.insertJoke('Why Java?', 'Programming');
    
    // Mark it as posted
    await jokeService.markAsPosted(jokeId);

    // Now try to select next joke
    const joke = await jokeService.selectNextJoke();
    expect(joke).not.toBeNull();
    expect(joke.id).toBe(jokeId);
    expect(joke.status).toBe('Pending'); // reset back to Pending
  });

  test('Should handle exhaustion strategy "stop"', async () => {
    process.env.ON_EXHAUSTION = 'stop';
    const jokeId = await jokeRepository.insertJoke('Why Java?', 'Programming');
    
    // Mark it as posted
    await jokeService.markAsPosted(jokeId);

    // Now try to select next joke
    const joke = await jokeService.selectNextJoke();
    expect(joke).toBeNull();
  });
});

describe('Bluesky Formatting Tests', () => {
  test('Should format posts correctly and keep under 300 chars', () => {
    const jokeObj = {
      id: 1,
      joke: 'A simple joke.',
      category: 'Programming'
    };
    
    const formatted = postingService.formatPost(jokeObj);
    expect(formatted.length).toBeLessThanOrEqual(300);
  });
});

describe('Image Generation & Posting Tests', () => {
  const imageGenerator = require('../src/utils/imageGenerator');

  beforeEach(async () => {
    await db.run('DELETE FROM jokes');
    await db.run('DELETE FROM tweet_logs');
    // Ensure POST_IMAGE is enabled for these tests
    process.env.POST_IMAGE = 'true';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Should generate image card and embed it in the post', async () => {
    // Mock image generation to return a fake buffer
    const fakeBuffer = Buffer.from('fake-png-data');
    jest.spyOn(imageGenerator, 'generateJokeCard').mockResolvedValue(fakeBuffer);

    // Mock bluesky upload and post
    const mockBlobRef = { $type: 'blob', ref: { $link: 'test_cid_link' }, mimeType: 'image/png', size: fakeBuffer.length };
    jest.spyOn(bluesky, 'uploadBlob').mockResolvedValue({ data: { blob: mockBlobRef } });
    const mockPostResponse = { uri: 'at://test/post/1', cid: 'test_cid_1' };
    jest.spyOn(bluesky, 'post').mockResolvedValue(mockPostResponse);

    const jokeId = await jokeRepository.insertJoke('Why do programmers prefer dark mode?', 'Programming');
    const jokeObj = { id: jokeId, joke: 'Why do programmers prefer dark mode?', category: 'Programming' };

    const result = await postingService.publishPost(jokeObj);

    // Verify image generator was called with the joke object
    expect(imageGenerator.generateJokeCard).toHaveBeenCalledWith(jokeObj);

    // Verify uploadBlob was called with the buffer and correct mime type
    expect(bluesky.uploadBlob).toHaveBeenCalledWith(fakeBuffer, 'image/png');

    // Verify post was called with text and the embed object
    expect(bluesky.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        $type: 'app.bsky.embed.images',
        images: expect.arrayContaining([
          expect.objectContaining({
            alt: expect.stringContaining('Programming'),
            image: mockBlobRef
          })
        ])
      })
    );

    expect(result).toEqual(mockPostResponse);
  });

  test('Should fall back to text-only post when image generation fails', async () => {
    // Mock image generation to throw an error
    jest.spyOn(imageGenerator, 'generateJokeCard').mockRejectedValue(new Error('Font loading failed'));

    // Mock bluesky post (should be called without embed)
    const mockPostResponse = { uri: 'at://test/post/2', cid: 'test_cid_2' };
    jest.spyOn(bluesky, 'post').mockResolvedValue(mockPostResponse);

    const jokeId = await jokeRepository.insertJoke('Fallback joke', 'Programming');
    const jokeObj = { id: jokeId, joke: 'Fallback joke', category: 'Programming' };

    const result = await postingService.publishPost(jokeObj);

    // Verify post was called with null embed (text-only fallback)
    expect(bluesky.post).toHaveBeenCalledWith(expect.any(String), null);
    expect(result).toEqual(mockPostResponse);
  });

  test('Should skip image generation when POST_IMAGE is false', async () => {
    process.env.POST_IMAGE = 'false';

    jest.spyOn(imageGenerator, 'generateJokeCard');
    const mockPostResponse = { uri: 'at://test/post/3', cid: 'test_cid_3' };
    jest.spyOn(bluesky, 'post').mockResolvedValue(mockPostResponse);

    const jokeId = await jokeRepository.insertJoke('No image joke', 'Random');
    const jokeObj = { id: jokeId, joke: 'No image joke', category: 'Random' };

    const result = await postingService.publishPost(jokeObj);

    // Image generator should NOT have been called
    expect(imageGenerator.generateJokeCard).not.toHaveBeenCalled();

    // Post should be called with null embed
    expect(bluesky.post).toHaveBeenCalledWith(expect.any(String), null);
    expect(result).toEqual(mockPostResponse);
  });
});

describe('API Endpoint Tests', () => {
  beforeEach(async () => {
    await db.run('DELETE FROM jokes');
    await db.run('DELETE FROM tweet_logs');
  });

  test('GET /status should return system health', async () => {
    const res = await request(app).get('/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.scheduler).toBeDefined();
  });

  test('POST /jokes/add should create a joke and redirect', async () => {
    const res = await request(app)
      .post('/jokes/add')
      .send({ joke: 'Express is cool', category: 'Programming' });
    
    expect(res.statusCode).toBe(302); // Redirect back to /
    
    const counts = await jokeRepository.getCounts();
    expect(counts.total).toBe(1);
  });

  test('POST /debug/trigger-job should trigger a post job', async () => {
    await jokeRepository.insertJoke('What is code?', 'Programming');

    const res = await request(app).post('/debug/trigger-job');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const counts = await jokeRepository.getCounts();
    expect(counts.posted).toBe(1);
  });
});
