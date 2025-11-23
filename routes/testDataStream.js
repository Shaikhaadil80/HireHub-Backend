const express = require('express');
const router = express.Router();
const TestData = require('../models/TestData');

/**
 * @route   GET /api/testdata/stream
 * @desc    Stream real-time data from testDataBase collection using SSE
 * @access  Public
 */
router.get('/stream', async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection message
  res.write('data: {"type":"connected","message":"Stream connected"}\n\n');

  try {
    // Send initial data
    const initialData = await TestData.find().sort({ createdAt: -1 }).limit(10);
    res.write(`data: ${JSON.stringify({ type: 'initial', data: initialData })}\n\n`);

    // Watch for changes in the collection using MongoDB Change Streams
    const changeStream = TestData.watch([], {
      fullDocument: 'updateLookup'
    });

    // Listen for changes
    changeStream.on('change', (change) => {
      console.log('Change detected:', change.operationType);
      
      const eventData = {
        type: change.operationType,
        timestamp: new Date().toISOString(),
        documentId: change.documentKey?._id,
        fullDocument: change.fullDocument
      };

      // Send the change to the client
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    });

    // Handle errors
    changeStream.on('error', (error) => {
      console.error('Change stream error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    });

    // Clean up when client disconnects
    req.on('close', () => {
      console.log('Client disconnected from stream');
      changeStream.close();
      res.end();
    });

  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
});

/**
 * @route   GET /api/testdata
 * @desc    Get all test data (regular GET endpoint)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 50, skip = 0, status } = req.query;
    
    const query = status ? { status } : {};
    
    const data = await TestData.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await TestData.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: data.length,
      total,
      data
    });
  } catch (error) {
    console.error('Error fetching test data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/testdata/:id
 * @desc    Get single test data by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const data = await TestData.findById(req.params.id);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Test data not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching test data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/testdata
 * @desc    Create test data (for testing purposes)
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const data = await TestData.create(req.body);
    
    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error creating test data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
