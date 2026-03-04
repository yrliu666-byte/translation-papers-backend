const axios = require('axios');
const config = require('../config');

class SemanticScholarFetcher {
  constructor() {
    this.baseUrl = config.apis.semanticScholar.baseUrl;
  }

  async fetchPapers(fromDate, toDate) {
    try {
      const query = this.buildQuery();
      const response = await axios.get(`${this.baseUrl}/paper/search`, {
        params: {
          query: query,
          fields: 'title,authors,abstract,venue,publicationDate,externalIds,url',
          limit: 100,
          publicationDateOrYear: `${fromDate}:${toDate}`
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      });

      return this.formatPapers(response.data.data || []);
    } catch (error) {
      console.error('Semantic Scholar fetch error:', error.message);
      return [];
    }
  }

  buildQuery() {
    // 构建查询：(translation AND (china OR chinese) AND history)
    return '(translation) AND (china OR chinese) AND (history)';
  }

  formatPapers(papers) {
    return papers.map(paper => ({
      id: paper.paperId || paper.externalIds?.DOI || `ss_${Date.now()}_${Math.random()}`,
      title: paper.title,
      authors: paper.authors?.map(a => a.name).join('; ') || 'Unknown',
      abstract: paper.abstract || 'No abstract available',
      journal: paper.venue || 'Unknown',
      publish_date: paper.publicationDate || new Date().toISOString().split('T')[0],
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      source: 'Semantic Scholar'
    })).filter(paper => this.isRelevant(paper));
  }

  isRelevant(paper) {
    const text = `${paper.title} ${paper.abstract}`.toLowerCase();

    // 排除中文论文（标题或摘要含中文字符）
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(`${paper.title} ${paper.abstract}`)) return false;

    // 必须包含 translation
    if (!text.includes('translation')) return false;

    // 必须包含 china 或 chinese
    if (!text.includes('china') && !text.includes('chinese')) return false;

    // 必须包含 history
    if (!text.includes('history')) return false;

    // 排除医学翻译
    if (text.includes('protein') || text.includes('gene') ||
        text.includes('medical translation') || text.includes('clinical')) {
      return false;
    }

    return true;
  }
}

module.exports = SemanticScholarFetcher;
