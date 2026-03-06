const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 3000;
const STARS_FILE = path.join(__dirname, 'stars.json');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname))); // Serve static files from current directory

// Initialize stars.json if it doesn't exist
async function initStarsFile() {
    try {
        const exists = await fs.pathExists(STARS_FILE);
        if (!exists) {
            // Create with sample data
            const sampleData = [
                {
                    "sl": 1,
                    "name": "Emma Watson",
                    "description": "British actress and activist",
                    "image_urls": [
                        "https://example.com/emma1.jpg",
                        "https://example.com/emma2.jpg"
                    ]
                },
                {
                    "sl": 2,
                    "name": "Scarlett Johansson",
                    "description": "American actress",
                    "image_urls": [
                        "https://example.com/scarlett1.jpg",
                        "https://example.com/scarlett2.jpg"
                    ]
                }
            ];
            await fs.writeJson(STARS_FILE, sampleData, { spaces: 2 });
            console.log('Created stars.json with sample data');
        }
    } catch (error) {
        console.error('Error initializing stars.json:', error);
    }
}

// API Routes

// GET all stars
app.get('/api/stars', async (req, res) => {
    try {
        const stars = await fs.readJson(STARS_FILE);
        res.json(stars);
    } catch (error) {
        console.error('Error reading stars:', error);
        res.status(500).json({ error: 'Failed to read stars data' });
    }
});

// GET single star by sl
app.get('/api/stars/:sl', async (req, res) => {
    try {
        const stars = await fs.readJson(STARS_FILE);
        const star = stars.find(s => s.sl === parseInt(req.params.sl));
        
        if (!star) {
            return res.status(404).json({ error: 'Star not found' });
        }
        
        res.json(star);
    } catch (error) {
        console.error('Error reading star:', error);
        res.status(500).json({ error: 'Failed to read star data' });
    }
});

// POST add new star
app.post('/api/stars', async (req, res) => {
    try {
        const stars = await fs.readJson(STARS_FILE);
        
        // Calculate new sl
        const newSl = stars.length > 0 ? Math.max(...stars.map(s => s.sl)) + 1 : 1;
        
        const newStar = {
            sl: newSl,
            name: req.body.name,
            description: req.body.description,
            image_urls: req.body.image_urls || []
        };
        
        // Validate required fields
        if (!newStar.name || !newStar.description) {
            return res.status(400).json({ error: 'Name and description are required' });
        }
        
        stars.push(newStar);
        await fs.writeJson(STARS_FILE, stars, { spaces: 2 });
        
        res.status(201).json(newStar);
    } catch (error) {
        console.error('Error adding star:', error);
        res.status(500).json({ error: 'Failed to add star' });
    }
});

// PUT update star
app.put('/api/stars/:sl', async (req, res) => {
    try {
        const stars = await fs.readJson(STARS_FILE);
        const sl = parseInt(req.params.sl);
        const index = stars.findIndex(s => s.sl === sl);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Star not found' });
        }
        
        // Validate required fields
        if (!req.body.name || !req.body.description) {
            return res.status(400).json({ error: 'Name and description are required' });
        }
        
        // Update star
        stars[index] = {
            sl: sl,
            name: req.body.name,
            description: req.body.description,
            image_urls: req.body.image_urls || []
        };
        
        await fs.writeJson(STARS_FILE, stars, { spaces: 2 });
        
        res.json(stars[index]);
    } catch (error) {
        console.error('Error updating star:', error);
        res.status(500).json({ error: 'Failed to update star' });
    }
});

// DELETE star
app.delete('/api/stars/:sl', async (req, res) => {
    try {
        const stars = await fs.readJson(STARS_FILE);
        const sl = parseInt(req.params.sl);
        const filteredStars = stars.filter(s => s.sl !== sl);
        
        if (filteredStars.length === stars.length) {
            return res.status(404).json({ error: 'Star not found' });
        }
        
        await fs.writeJson(STARS_FILE, filteredStars, { spaces: 2 });
        
        res.json({ message: 'Star deleted successfully' });
    } catch (error) {
        console.error('Error deleting star:', error);
        res.status(500).json({ error: 'Failed to delete star' });
    }
});

// Start server
async function startServer() {
    await initStarsFile();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📁 stars.json location: ${STARS_FILE}`);
    });
}

startServer();