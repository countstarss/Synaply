# Synaply SEO 第二阶段执行清单

本文档用于承接已经完成的 SEO 第一阶段基础设施，并指导下一阶段把 Synaply 的自然搜索从“可抓取、可索引”升级到“可持续获取非品牌流量、可稳定产出高意图入口页”。

生产域名统一按 `https://synaply.team` 执行。

## 1. 当前基线

第一阶段已经完成的能力：

- 公开营销页 `landing`、`pricing`、`about` 已具备页面级 metadata、canonical、`hreflang`、OG、Twitter Card。
- 产品区、认证区、回调页已统一 `noindex, nofollow`。
- `robots.txt` 与 `sitemap.xml` 已上线，只暴露当前允许索引的营销页。
- 多语言 canonical 和 locale 保留跳转已补齐。
- 站点 SEO 配置已收口到 [src/lib/seo.ts](/Users/luke/Synaply/apps/frontend/src/lib/seo.ts)。

这意味着技术基础已经够用，第二阶段的重点不再是“补标签”，而是“扩内容面、扩意图面、扩入口页面”。

## 2. 第二阶段目标

### 2.1 业务目标

- 把 Synaply 从只覆盖品牌词，推进到覆盖高意图非品牌词。
- 让搜索用户能直接进入与其场景匹配的页面，而不是只能落到首页。
- 让 SEO 入口页和 Synaply 的产品定位保持一致，不把产品带偏成泛项目管理工具。

### 2.2 SEO 目标

3 个月内争取达到以下结果：

- 索引页从当前 3 个核心营销页，扩展到 20 到 30 个高质量公开页。
- 建立 `features`、`use-cases`、`templates`、`integrations`、`compare` 五个主题簇。
- 在 Search Console 中开始出现稳定的非品牌 impression 和 click。
- 至少 10 个页面进入明确商业意图或解决方案意图的 query 集合。

### 2.3 不做的事情

- 第二阶段不先做大而全 blog。
- 不做泛“项目管理软件”导向内容。
- 不做门页、关键词堆砌页、批量低质量 AI 生成页。
- 不让产品区应用页面参与索引。

## 3. 核心原则

- 页面必须服务真实搜索意图，而不是服务关键词列表。
- 内容必须围绕 Synaply 的产品核心链路：`Project -> Issue -> Workflow -> Doc -> Inbox`。
- 优先覆盖与 handoff、blockers、decision log、async digest、template、GitHub/Slack bridge 相关的场景。
- `zh` 与 `en` 页面做完整内容优化，`ja` 与 `ko` 保持基础索引完整性即可。
- 每个新页面都必须有明确的站内链接入口，不允许孤儿页。

## 4. 执行顺序总览

按下面顺序推进：

1. 搭建第二阶段的信息架构和目录。
2. 先上线高意图页面矩阵，不先开 blog。
3. 再补页面模板、截图、内部链接和结构化数据。
4. 接入 Search Console、Bing Webmaster Tools、IndexNow。
5. 上线后按 impression、CTR、索引状态和 query 反馈迭代。

## 5. 站点结构与页面矩阵

第二阶段建议新增五类可索引目录：

- `/features/*`
- `/use-cases/*`
- `/templates/*`
- `/integrations/*`
- `/compare/*`

### 5.1 第一批优先页面

以下页面优先级最高，建议先做 20 个左右：

#### A. Features

- `/features/handoffs`
- `/features/blocker-tracking`
- `/features/decision-log`
- `/features/async-digest`
- `/features/workflow-visibility`

对应意图：

- 跨角色交接
- 阻塞管理
- 决策留痕
- 异步进度同步
- 远程团队流程透明

#### B. Use Cases

- `/use-cases/remote-product-teams`
- `/use-cases/design-engineering-handoff`
- `/use-cases/product-design-engineering-alignment`
- `/use-cases/async-release-planning`
- `/use-cases/small-cross-functional-teams`

对应意图：

- 远程产品团队协作
- 设计与工程交接
- 产品设计工程协同
- 异步发布推进
- 3 到 15 人跨职能团队协作

#### C. Templates

- `/templates/product-brief`
- `/templates/design-review`
- `/templates/release-checklist`
- `/templates/retrospective`
- `/templates/weekly-async-update`
- `/templates/decision-log`

对应意图：

- 模板型流量
- 下载型流量
- 复制即用型流量
- 高分享与高收藏意图

#### D. Integrations

- `/integrations/github`
- `/integrations/slack`
- `/integrations/github-slack-handoff`

对应意图：

- GitHub 协作桥接
- Slack 通知桥接
- 工程执行与异步协同串联

#### E. Compare

- `/compare/linear-alternative`
- `/compare/asana-alternative-for-remote-product-teams`
- `/compare/notion-vs-synaply-for-execution`

对应意图：

- 商业替代词
- 高转化意图
- 产品定位差异表达

### 5.2 第二批候选页面

第一批上线后，如果数据正向，再推进：

- `/features/team-pulse`
- `/features/personal-pulse`
- `/features/issue-dependencies`
- `/use-cases/startup-ops-handoff`
- `/use-cases/remote-design-review`
- `/templates/bug-triage`
- `/templates/sprint-planning`
- `/templates/postmortem`
- `/compare/jira-alternative-for-small-product-teams`
- `/compare/clickup-alternative`

## 6. 页面模板规范

每个新页面都必须满足以下模板要求。

### 6.1 页面信息架构

- 只有一个主 `H1`。
- 首屏副标题必须清楚表达“谁适合 + 解决什么问题”。
- 第一屏下方必须尽快出现真实产品截图或流程示意，而不是抽象宣传语。
- 页面中段必须包含：
  - 工作流程说明
  - 使用场景
  - 适合团队类型
  - 与现有工作方式对比
  - CTA
- 页面底部必须串联至少 3 个相关页面入口。

### 6.2 SEO 元素清单

每个页面必须包含：

- 唯一 `title`
- 唯一 `description`
- self-canonical
- 对应 locale 的 `hreflang`
- 页面级 Open Graph
- 页面级 Twitter Card
- 至少一种结构化数据
- 明确的图片 `alt`
- 清晰、可抓取的 HTML 链接

### 6.3 页面 copy 规则

- 不要写空泛品牌词。
- 不要大量使用“all-in-one”“best tool”这类低信息密度表达。
- 用具体协作动作描述价值，比如：
  - request design review
  - hand off to engineering
  - track blockers
  - keep decisions visible
  - send async progress digest
- 中文页和英文页都要按各自搜索意图重写，不做直译。

## 7. 每类页面的内容要求

### 7.1 Features 页面

目标：拿功能词和问题词流量。

每页至少包含：

- 场景问题定义
- Synaply 如何解决
- 对应对象之间的 handoff 关系
- 一张真实界面截图
- 关联功能链接
- CTA 指向 `pricing` 或 `landing`

### 7.2 Use Cases 页面

目标：拿角色组合词和团队场景词流量。

每页至少包含：

- 哪类团队适合
- 当前协作痛点
- 一条典型工作流
- 适用角色组合
- 适合与不适合的边界
- 指向相关模板页和功能页

### 7.3 Templates 页面

目标：拿高意图模板词。

每页至少包含：

- 模板解决什么问题
- 模板结构示例
- 推荐使用时机
- 与 Projects / Issues / Docs / Inbox 的映射方式
- 页面内预览
- CTA 引导创建或试用

### 7.4 Integrations 页面

目标：拿集成词和桥接词。

每页至少包含：

- 集成对象是什么
- 数据流或协作流怎么走
- 能替代哪些手工同步动作
- 适用边界和注意事项
- 指向 use-case 页面

### 7.5 Compare 页面

目标：拿替代词与比较词。

每页至少包含：

- 适合谁切换
- 不同产品的核心差异
- 不要贬低式写法，要清楚写定位差异
- 为什么 Synaply 更适合远程小型跨职能团队
- 指向功能页、模板页、定价页

## 8. 技术执行清单

### 8.1 路由与目录

- [ ] 为新营销页建立统一目录策略。
- [ ] 评估是否将营销页收口到 `src/app/[locale]/(marketing)/...` 路由组，降低与产品区混杂程度。
- [ ] 为每个新目录增加 `page.tsx` 与可复用的 client body 结构。
- [ ] 继续沿用 [src/lib/seo.ts](/Users/luke/Synaply/apps/frontend/src/lib/seo.ts) 的 SEO helper，不再分散写绝对 URL。

### 8.2 SEO 基础设施

- [ ] 扩展 `INDEXABLE_MARKETING_PATHS`，把新增公开页纳入 sitemap。
- [ ] 为每类新页面增加 metadata builder，避免页面级 SEO 文案散落在组件里。
- [ ] 为每类页面增加 JSON-LD 生成器。
- [ ] 保持产品区和认证区的 `noindex` 边界不被破坏。
- [ ] 为 404、无内容页、废弃页制定统一返回策略，避免 soft 404。

### 8.3 结构化数据

推荐使用：

- `Organization`
- `WebSite`
- `SoftwareApplication`
- `BreadcrumbList`
- `ItemList`

执行项：

- [ ] 首页维持站点级 `Organization` + `WebSite` + `SoftwareApplication`。
- [ ] `features` 页增加 `BreadcrumbList`。
- [ ] `templates` 列表页增加 `ItemList`。
- [ ] `compare` 页保持清晰 breadcrumb 和产品上下文。
- [ ] 上线前全部跑一次 Rich Results Test。

### 8.4 性能与渲染

- [ ] 所有公开页默认 SSR 或预渲染。
- [ ] 公开页首屏图像使用可控尺寸和压缩策略。
- [ ] 控制第三方脚本数量，避免影响 LCP 和 INP。
- [ ] 公开页避免把主要内容放在客户端首轮渲染后才出现。
- [ ] 定期检查 CLS，尤其是营销页图片和 CTA 区块。

### 8.5 图片与社交分享

- [ ] 为五类页面设计统一 OG 视觉体系。
- [ ] 如果资源允许，后续升级为动态 OG。
- [ ] 每个页面至少有 1 张真实产品截图。
- [ ] 截图命名、alt、压缩规则统一。

## 9. 内容生产执行清单

### 9.1 页面创建前

- [ ] 为每个页面定义唯一主 query。
- [ ] 为每个页面定义 3 到 5 个辅助 query。
- [ ] 写出目标人群和核心问题。
- [ ] 确定该页属于哪个主题簇。
- [ ] 确定该页要链接到哪些上下游页面。

### 9.2 页面撰写时

- [ ] 首段在 2 到 3 句内说明对象、问题、价值。
- [ ] 每页至少包含 3 个以上小节，不要只有短销售信息。
- [ ] 每页加入真实协作流程说明。
- [ ] 每页至少加入 1 个与 Synaply 产品对象直接关联的例子。
- [ ] 每页至少加入 3 个站内链接。
- [ ] 每页 CTA 明确，不要多个主 CTA 打架。

### 9.3 页面发布前

- [ ] 检查 title、description、canonical、`hreflang`。
- [ ] 检查 H1、H2 和内部链接锚文本。
- [ ] 检查图片 `alt`。
- [ ] 检查结构化数据。
- [ ] 检查是否出现在 sitemap。
- [ ] 检查是否被错误 `noindex`。

## 10. 工具与平台接入清单

### 10.1 Search Console

- [ ] 添加并验证 `https://synaply.team` 属性。
- [ ] 提交 `sitemap.xml`。
- [ ] 记录首页、定价页、关于页与第一批新页面的 URL Inspection 状态。
- [ ] 建立每周一次的索引覆盖检查节奏。

### 10.2 Bing Webmaster Tools

- [ ] 添加并验证 `https://synaply.team`。
- [ ] 提交 sitemap。
- [ ] 检查抓取与索引错误。

### 10.3 IndexNow

- [ ] 确认是否接入 IndexNow。
- [ ] 若接入，新增和更新页面时自动推送 URL。
- [ ] 确保不对 `noindex` 页面推送提交。

## 11. 站内链接策略

内部链接必须按主题簇组织，不要随机串。

### 11.1 Hub 页

建议后续增加五个 hub 页面：

- `/features`
- `/use-cases`
- `/templates`
- `/integrations`
- `/compare`

每个 hub 页都应：

- 解释这一类内容对谁有用
- 列出全部子页
- 提供清晰分类
- 反向链接到 `landing` 或 `pricing`

### 11.2 子页链接规则

- `features` 页链接到至少 1 个 `use-cases` 页和 1 个 `templates` 页。
- `use-cases` 页链接到至少 2 个 `features` 页和 1 个 `pricing` 页。
- `templates` 页链接到至少 1 个 `use-cases` 页和 1 个 `landing` 页。
- `integrations` 页链接到相关 `use-cases` 和 `features` 页。
- `compare` 页链接到 `pricing`、`landing` 与最相关的 `features` 页。

## 12. 指标与复盘机制

每周固定看以下数据：

- 有效索引页数量
- 新增页面的抓取与索引状态
- 非品牌 query 的 impression
- 重点页面 CTR
- 重点页面平均排名
- 页面级点击入口
- Core Web Vitals 分组状态

### 12.1 判定一个页面是否有效

满足以下至少 3 条，可视为有效页面：

- 已被索引
- 有非品牌 impression
- 有 query 排名进入前 30
- CTR 不低于同类页平均水平
- 有来自站内其他页的稳定点击流入

### 12.2 需要迭代的信号

出现以下情况时要回改页面：

- 有 impression 但 CTR 很低
- 有索引但长期没有 impression
- 标题和内容不匹配
- 页面内部链接太弱
- 页面内容过短或缺少真实使用场景

## 13. 推荐推进节奏

### Week 1

- 建好目录、模板和 hub 页骨架
- 确定第一批 20 个页面的 query 与 slug
- 接入 Search Console 和 Bing Webmaster Tools

### Week 2

- 上线 5 个 `features` 页
- 上线 3 个 `use-cases` 页
- 打通内部链接骨架

### Week 3

- 上线 6 个 `templates` 页
- 补截图、alt、JSON-LD、OG 素材

### Week 4

- 上线 3 个 `integrations` 页
- 上线 3 个 `compare` 页
- 提交索引与检查抓取状态

### Week 5 到 Week 6

- 根据 Search Console 的 query 数据回改标题、描述、H1、首段和内部链接
- 找出 CTR 高但排名低的页继续补内容
- 找出有 impression 无点击的页重写标题和描述

## 14. Definition of Done

第二阶段达到“完成”至少要满足：

- 五类目录全部落地。
- 第一批优先页面至少上线 20 个。
- 每页 metadata、canonical、`hreflang`、结构化数据完整。
- 所有页都在 sitemap 中且可被抓取。
- Search Console 能看到稳定的非品牌 impression。
- 至少 5 个页面已经出现明确的商业意图 query 点击。

## 15. 实施建议

如果要落地到代码层，建议按这个顺序建：

1. 先抽象一个营销页 SEO 配置中心，把各类页面的 title、description、JSON-LD builder 收口。
2. 再搭五类页面的 server entry + client body 模板。
3. 再集中做第一批页面内容，而不是边写边想目录。
4. 最后接入 Search Console、Bing、IndexNow 和每周复盘流程。

## 16. 后续文档建议

本文档之后，建议继续补两份配套文档：

- `SEO页面文案模板.md`
- `Search Console每周复盘模板.md`

这样后续新增页面时，不需要从零开始想结构和检查项。
