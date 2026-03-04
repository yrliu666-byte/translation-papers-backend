const schedule = require('node-schedule');
const PaperAggregator = require('./aggregator');
const emailService = require('./emailService');
const fs = require('fs').promises;
const path = require('path');

class PaperScheduler {
  constructor() {
    this.aggregator = new PaperAggregator();
    this.dataPath = path.join(__dirname, '../data/papers.json');
    this.subscribersPath = path.join(__dirname, '../data/subscribers.json');
  }

  async initialize() {
    // 确保数据目录存在
    await fs.mkdir(path.dirname(this.dataPath), { recursive: true });

    // 加载测试数据（暂时禁用自动抓取）
    await this.loadTestData();

    // 每天12点执行更新（暂时注释掉）
    // schedule.scheduleJob('0 12 * * *', async () => {
    //   console.log('Scheduled update triggered at 12:00');
    //   await this.updatePapers();
    // });

    // 每周一北京时间09:00发送邮件周报
    schedule.scheduleJob({ rule: '0 9 * * 1', tz: 'Asia/Shanghai' }, async () => {
      console.log('Weekly email digest triggered (Monday 09:00 CST)');
      await this.sendWeeklyEmail();
    });

    console.log('Paper scheduler initialized with test data.');
    console.log('Weekly digest scheduled: every Monday at 09:00 CST');
  }

  async loadTestData() {
    const testPapers = [
      {
        id: "10.1080/13556509.2025.2234567",
        title: "Missionary Translation and Religious Reform in Late Qing China",
        authors: "Zhang, Wei; Liu, Xiaoming",
        abstract: "This paper examines the role of missionary translation activities in shaping religious reform movements during the late Qing dynasty. It analyzes how translated religious texts influenced Chinese intellectual discourse and contributed to broader social transformations.",
        journal: "Translation Studies",
        publish_date: "2026-02-28",
        url: "https://doi.org/10.1080/13556509.2025.2234567",
        source: "CrossRef"
      },
      {
        id: "10.1353/chl.2026.0012",
        title: "Translation Networks in Early Modern China: The Jesuit Connection",
        authors: "Wang, Hui",
        abstract: "This study explores the translation networks established by Jesuit missionaries in early modern China, focusing on how these networks facilitated the transmission of Western scientific and religious knowledge through translation.",
        journal: "Chinese Historical Review",
        publish_date: "2026-02-25",
        url: "https://doi.org/10.1353/chl.2026.0012",
        source: "CrossRef"
      },
      {
        id: "10.1017/S0041977X25000234",
        title: "Women Translators in Republican China: Gender and Literary History",
        authors: "Chen, Yun; Li, Mei",
        abstract: "This article investigates the contributions of women translators during the Republican period in China, examining how their translation work intersected with feminist movements and shaped modern Chinese literary history.",
        journal: "Bulletin of the School of Oriental and African Studies",
        publish_date: "2026-02-20",
        url: "https://doi.org/10.1017/S0041977X25000234",
        source: "CrossRef"
      },
      {
        id: "10.1163/15700615-12341567",
        title: "Translation and Diplomatic History: Sino-Western Relations in the 19th Century",
        authors: "Huang, Jian",
        abstract: "This paper analyzes the role of translation in diplomatic exchanges between China and Western powers during the 19th century, highlighting how translation practices shaped international relations and treaty negotiations.",
        journal: "Journal of World History",
        publish_date: "2026-02-18",
        url: "https://doi.org/10.1163/15700615-12341567",
        source: "CrossRef"
      },
      {
        id: "10.1215/00267929-2026-0045",
        title: "Theater Translation and Cultural Exchange in Ming-Qing China",
        authors: "Zhou, Lin",
        abstract: "This study examines how theatrical works were translated and adapted in Ming and Qing China, exploring the cultural exchange between Chinese and foreign dramatic traditions through translation.",
        journal: "Comparative Drama",
        publish_date: "2026-02-15",
        url: "https://doi.org/10.1215/00267929-2026-0045",
        source: "CrossRef"
      },
      {
        id: "10.1093/tcbh/hwab012",
        title: "Educational Reform Through Translation: Western Pedagogy in Late Qing China",
        authors: "Ma, Qiang; Sun, Ying",
        abstract: "This article investigates how the translation of Western educational texts contributed to educational reform movements in late Qing China, analyzing the impact of translated pedagogical theories on Chinese education history.",
        journal: "History of Education Quarterly",
        publish_date: "2026-02-12",
        url: "https://doi.org/10.1093/tcbh/hwab012",
        source: "CrossRef"
      },
      {
        id: "10.1177/0021989425123456",
        title: "Translation and Intellectual History: The Introduction of Western Philosophy to China",
        authors: "Xu, Ming",
        abstract: "This paper explores how the translation of Western philosophical texts shaped Chinese intellectual history in the late 19th and early 20th centuries, examining the role of translators as cultural mediators.",
        journal: "Journal of the History of Ideas",
        publish_date: "2026-02-10",
        url: "https://doi.org/10.1177/0021989425123456",
        source: "CrossRef"
      },
      {
        id: "10.1086/ahr/131.1.234",
        title: "Translation and the Making of Modern Chinese Literature: A Historical Perspective",
        authors: "Gao, Feng; Wu, Dan",
        abstract: "This study provides a historical perspective on how translation activities contributed to the formation of modern Chinese literature, analyzing the translation strategies and cultural contexts that shaped literary history.",
        journal: "American Historical Review",
        publish_date: "2026-02-08",
        url: "https://doi.org/10.1086/ahr/131.1.234",
        source: "CrossRef"
      }
    ];

    await fs.writeFile(
      this.dataPath,
      JSON.stringify({
        lastUpdate: new Date().toISOString(),
        count: testPapers.length,
        papers: testPapers
      }, null, 2)
    );

    console.log(`Loaded ${testPapers.length} test papers.`);
  }

  async updatePapers() {
    try {
      console.log('Starting paper update...');
      const papers = await this.aggregator.fetchLast24Hours();

      await fs.writeFile(
        this.dataPath,
        JSON.stringify({
          lastUpdate: new Date().toISOString(),
          count: papers.length,
          papers: papers
        }, null, 2)
      );

      console.log(`Update complete. ${papers.length} papers saved.`);
      return papers;
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  }

  async getPapers() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.log('No existing data, returning empty array');
      return { lastUpdate: null, count: 0, papers: [] };
    }
  }

  async addSubscriber(email) {
    const subscribers = await this.getSubscribers();
    if (!subscribers.includes(email)) {
      subscribers.push(email);
      await fs.writeFile(this.subscribersPath, JSON.stringify({ subscribers }, null, 2));
      console.log(`Subscriber added: ${email}`);
    }
    return subscribers;
  }

  async getSubscribers() {
    try {
      const data = await fs.readFile(this.subscribersPath, 'utf-8');
      return JSON.parse(data).subscribers || [];
    } catch {
      return [];
    }
  }

  async sendWeeklyEmail() {
    const subscribers = await this.getSubscribers();
    const papersData = await this.getPapers();
    await emailService.sendWeeklyDigest(subscribers, papersData.papers);
  }
}

module.exports = PaperScheduler;
