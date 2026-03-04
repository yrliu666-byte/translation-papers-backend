const axios = require('axios');
const config = require('../config');

class CrossRefFetcher {
  constructor() {
    this.baseUrl = config.apis.crossref.baseUrl;
  }

  async fetchPapers(fromDate, toDate) {
    try {
      const query = 'translation china chinese history';
      const response = await axios.get(this.baseUrl, {
        params: {
          query: query,
          filter: `from-pub-date:${fromDate},until-pub-date:${toDate}`,
          rows: 100,
          select: 'DOI,title,author,abstract,container-title,published,URL'
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      });

      return this.formatPapers(response.data.message?.items || []);
    } catch (error) {
      console.error('CrossRef fetch error:', error.message);
      return [];
    }
  }

  formatPapers(papers) {
    return papers.map(paper => {
      const date = paper.published?.['date-parts']?.[0];
      const publishDate = date ?
        `${date[0]}-${String(date[1] || 1).padStart(2, '0')}-${String(date[2] || 1).padStart(2, '0')}` :
        new Date().toISOString().split('T')[0];

      return {
        id: paper.DOI || `cr_${Date.now()}_${Math.random()}`,
        title: Array.isArray(paper.title) ? paper.title[0] : paper.title,
        authors: paper.author?.map(a => `${a.given || ''} ${a.family || ''}`).join('; ') || 'Unknown',
        abstract: paper.abstract || 'No abstract available',
        journal: Array.isArray(paper['container-title']) ?
          paper['container-title'][0] : paper['container-title'] || 'Unknown',
        publish_date: publishDate,
        url: paper.URL || `https://doi.org/${paper.DOI}`,
        source: 'CrossRef'
      };
    }).filter(paper => this.isRelevant(paper));
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

module.exports = CrossRefFetcher;
