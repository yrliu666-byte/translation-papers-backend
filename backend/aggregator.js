const SemanticScholarFetcher = require('./fetchers/semanticScholar');
const CrossRefFetcher = require('./fetchers/crossref');
const ArXivFetcher = require('./fetchers/arxiv');
const RailwayFetcher = require('./fetchers/railway');

class PaperAggregator {
  constructor() {
    this.fetchers = [
      new RailwayFetcher(), // 优先使用 Railway 数据源
      new SemanticScholarFetcher(),
      new CrossRefFetcher(),
      new ArXivFetcher()
    ];
  }

  async fetchAllPapers(fromDate, toDate) {
    console.log(`Fetching papers from ${fromDate} to ${toDate}...`);

    const results = await Promise.allSettled(
      this.fetchers.map(fetcher => fetcher.fetchPapers(fromDate, toDate))
    );

    const allPapers = results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);

    console.log(`Fetched ${allPapers.length} papers before deduplication`);

    const deduplicated = this.deduplicatePapers(allPapers);
    console.log(`${deduplicated.length} papers after deduplication`);

    return this.shufflePapers(deduplicated);
  }

  deduplicatePapers(papers) {
    const seen = new Map();

    for (const paper of papers) {
      const normalizedTitle = this.normalizeTitle(paper.title);

      if (!seen.has(normalizedTitle)) {
        seen.set(normalizedTitle, paper);
      } else {
        // 如果已存在，保留信息更完整的那个
        const existing = seen.get(normalizedTitle);
        if (this.scoreCompleteness(paper) > this.scoreCompleteness(existing)) {
          seen.set(normalizedTitle, paper);
        }
      }
    }

    return Array.from(seen.values());
  }

  normalizeTitle(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  scoreCompleteness(paper) {
    let score = 0;
    if (paper.abstract && paper.abstract !== 'No abstract available') score += 3;
    if (paper.authors && paper.authors !== 'Unknown') score += 2;
    if (paper.journal && paper.journal !== 'Unknown') score += 1;
    if (paper.url) score += 1;
    return score;
  }

  shufflePapers(papers) {
    const shuffled = [...papers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async fetchLast24Hours() {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 改为30天

    const toDate = now.toISOString().split('T')[0];
    const fromDate = daysAgo.toISOString().split('T')[0];

    return this.fetchAllPapers(fromDate, toDate);
  }
}

module.exports = PaperAggregator;
