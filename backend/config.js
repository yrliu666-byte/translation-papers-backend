// 数据源配置
module.exports = {
  // 关键词配置
  keywords: {
    required: ['translation', 'china', 'chinese', 'history'],
    exclude: ['medical translation', 'protein translation', 'gene translation']
  },

  // 学科领域
  fields: [
    'translation studies',
    'diplomatic history',
    'religious history',
    'literary history',
    'theater history',
    'women\'s history',
    'education history',
    'cultural history',
    'intellectual history'
  ],

  // API 配置
  apis: {
    semanticScholar: {
      baseUrl: 'https://api.semanticscholar.org/graph/v1',
      rateLimit: 100 // 每5分钟
    },
    crossref: {
      baseUrl: 'https://api.crossref.org/works',
      rateLimit: 50 // 每秒
    },
    arxiv: {
      baseUrl: 'http://export.arxiv.org/api/query',
      rateLimit: 3 // 每秒
    }
  },

  // 更新配置
  schedule: {
    updateTime: '12:00', // 每天12点
    lookbackHours: 24 // 抓取过去24小时的论文
  }
};
