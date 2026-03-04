const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

class RailwayFetcher {
  constructor() {
    this.baseUrl = 'https://web-production-24cce.up.railway.app';
    // 创建自定义 HTTPS agent 来忽略证书验证（仅用于开发）
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
  }

  async fetchPapers(fromDate, toDate) {
    try {
      console.log('Fetching papers from Railway app...');
      const response = await axios.get(this.baseUrl, {
        timeout: 15000,
        httpsAgent: this.httpsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const papers = this.parseHTML(response.data);
      console.log(`Fetched ${papers.length} papers from Railway app`);
      return papers;
    } catch (error) {
      console.error('Railway fetch error:', error.message);
      return [];
    }
  }

  parseHTML(html) {
    const $ = cheerio.load(html);
    const papers = [];

    $('.paper-item').each((index, element) => {
      const $item = $(element);
      const title = $item.find('.paper-title').text().trim();
      const metaText = $item.find('.paper-meta').text().trim();

      // 解析元数据
      const authors = this.extractField(metaText, '作者：');
      const journal = this.extractField(metaText, '期刊：');
      const date = this.extractField(metaText, '日期：');
      const rawAbstract = $item.find('.paper-abstract').text().trim();
      const url = $item.find('a').attr('href') || '';

      // 清理摘要：移除 HTML 标签和特殊符号
      const cleanAbstract = this.cleanAbstract(rawAbstract);

      if (title) {
        papers.push({
          id: `railway-${Date.now()}-${index}`,
          title: title,
          authors: authors || 'Unknown',
          abstract: cleanAbstract || '暂无摘要',
          journal: journal || 'Unknown',
          publish_date: date || new Date().toISOString().split('T')[0],
          url: url || `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`,
          source: 'Railway App'
        });
      }
    });

    return papers;
  }

  cleanAbstract(text) {
    if (!text) return '';

    // 移除 HTML 标签（如 <jats:p>, <i>, <b> 等）
    let cleaned = text.replace(/<[^>]+>/g, '');

    // 移除多余的空白字符
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // 移除特殊符号，只保留中英文、数字、基本标点
    // 保留：字母、数字、中文、常用标点（。，、；：？！""''()[].-,;:?!'"）
    cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s\.\,\;\:\?\!\"\'\(\)\[\]\-\u3000-\u303f]/g, '');

    return cleaned;
  }

  extractField(text, label) {
    const regex = new RegExp(`${label}([^|]+)`);
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
}

module.exports = RailwayFetcher;
