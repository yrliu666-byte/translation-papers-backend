const axios = require('axios');
const xml2js = require('xml2js');
const config = require('../config');

class ArXivFetcher {
  constructor() {
    this.baseUrl = config.apis.arxiv.baseUrl;
    this.parser = new xml2js.Parser();
  }

  async fetchPapers(fromDate, toDate) {
    try {
      const query = 'all:translation AND all:china AND all:history';
      const response = await axios.get(this.baseUrl, {
        params: {
          search_query: query,
          start: 0,
          max_results: 100,
          sortBy: 'submittedDate',
          sortOrder: 'descending'
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      });

      const result = await this.parser.parseStringPromise(response.data);
      const entries = result.feed?.entry || [];

      return this.formatPapers(entries, fromDate, toDate);
    } catch (error) {
      console.error('arXiv fetch error:', error.message);
      return [];
    }
  }

  formatPapers(entries, fromDate, toDate) {
    return entries.map(entry => {
      const publishDate = entry.published?.[0]?.split('T')[0] || new Date().toISOString().split('T')[0];

      return {
        id: entry.id?.[0]?.split('/abs/')?.[1] || `arxiv_${Date.now()}_${Math.random()}`,
        title: entry.title?.[0]?.replace(/\s+/g, ' ').trim() || 'Untitled',
        authors: entry.author?.map(a => a.name?.[0]).join('; ') || 'Unknown',
        abstract: entry.summary?.[0]?.replace(/\s+/g, ' ').trim() || 'No abstract available',
        journal: 'arXiv',
        publish_date: publishDate,
        url: entry.id?.[0] || '',
        source: 'arXiv'
      };
    }).filter(paper => {
      const paperDate = new Date(paper.publish_date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      return paperDate >= from && paperDate <= to && this.isRelevant(paper);
    });
  }

  isRelevant(paper) {
    const text = `${paper.title} ${paper.abstract}`.toLowerCase();

    // 排除中文论文（标题或摘要含中文字符）
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(`${paper.title} ${paper.abstract}`)) return false;

    if (!text.includes('translation')) return false;
    if (!text.includes('china') && !text.includes('chinese')) return false;
    if (!text.includes('history')) return false;

    if (text.includes('protein') || text.includes('gene') ||
        text.includes('medical translation') || text.includes('clinical')) {
      return false;
    }

    return true;
  }
}

module.exports = ArXivFetcher;
