# Translation Papers Backend

后端服务，每天12点自动抓取中国翻译史相关英文论文

## 安装依赖

```bash
cd backend
npm install
```

## 启动服务

```bash
npm start
```

服务将在 `http://localhost:3000` 启动

## API 接口

### 获取论文列表
```
GET /api/papers
```

返回示例：
```json
{
  "lastUpdate": "2026-03-04T12:00:00.000Z",
  "count": 15,
  "papers": [
    {
      "id": "...",
      "title": "...",
      "authors": "...",
      "abstract": "...",
      "journal": "...",
      "publish_date": "2026-03-04",
      "url": "...",
      "source": "Semantic Scholar"
    }
  ]
}
```

### 手动触发更新
```
POST /api/update
```

## 数据源

- **Semantic Scholar** - 学术论文搜索引擎
- **CrossRef** - 学术文献元数据库
- **arXiv** - 预印本论文库

## 关键词过滤

必须包含：
- `translation` (翻译)
- `china` 或 `chinese` (中国/中文)
- `history` (历史)

排除医学翻译相关内容

## 自动更新

每天12:00自动抓取过去24小时的新论文
