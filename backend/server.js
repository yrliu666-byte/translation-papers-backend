const express = require('express');
const PaperScheduler = require('./scheduler');

const app = express();
const scheduler = new PaperScheduler();

app.use(express.json());

// CORS 支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 获取论文列表
app.get('/api/papers', async (req, res) => {
  try {
    const data = await scheduler.getPapers();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 手动触发更新
app.post('/api/update', async (req, res) => {
  try {
    const papers = await scheduler.updatePapers();
    res.json({ success: true, count: papers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 订阅周报
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    const subscribers = await scheduler.addSubscriber(email);
    res.json({ success: true, message: 'Subscribed successfully', total: subscribers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

async function start() {
  await scheduler.initialize();
  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ API endpoint: http://localhost:${PORT}/api/papers`);
    console.log(`✓ Daily updates scheduled at 12:00`);
  });
}

start().catch(console.error);
