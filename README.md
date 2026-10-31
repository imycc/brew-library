# 沖煮配方庫 · Brew Library

一個免費、支援九語的咖啡沖煮配方網站。

**目的：** 整理世界各地咖啡師與比賽的原版配方，讓大家按現有器材查找、閱讀沖煮步驟，並比較不同方法。每份配方保留原始來源、版本及核對日期；來源未提供的資料不自行補上。

☕ **[瀏覽配方庫](https://imycc.github.io/brew-library/zh-Hant/)**

🔧 **[瀏覽器材資料庫](https://imycc.github.io/brew-library/zh-Hant/equipment/)**：按濾杯、手沖壺、磨豆器及濾紙搜尋官方規格、相容性與相關配方。

## 一起補充資料

歡迎咖啡愛好者一起加入，毋須懂寫程式！你可以：

- 分享作者、官方頻道或合作品牌發布的配方與比賽影片。
- 補充器材資料、修正數值、回報失效連結。
- 協助翻譯、校對，讓更多人讀懂配方。

請開 [Issue](https://github.com/imycc/brew-library/issues/new) 提供資料，或直接提交 Pull Request。新增配方請附作者、器材、原始連結及可核實的參數／步驟；不同版本分開整理，未知條件明確標示。請用自己的文字摘要，避免整篇轉載。

配方資料位於 [`content/recipes.json`](content/recipes.json)，器材資料位於 [`content/equipment.json`](content/equipment.json)，翻譯位於 [`messages/`](messages/)。八份策展配方的觀察點與單一變數練習儲存在 [`content/learning.json`](content/learning.json)，九語學習文字位於 `messages/education-{locale}.json`；整理準則及核對筆記見 [來源紀錄](docs/research.md)。

配方頁把手沖與濃縮分成兩個分頁，各自可按器材、作者、粉量及來源標示的豆子條件篩選（手沖另有濾紙）；[訪客統計](docs/analytics.md)由 GoatCounter 提供。

[沖煮學習指南](https://imycc.github.io/brew-library/zh-Hant/learn/)把配方拆成四個學習步驟：先固定條件、按來源做一次基準、同時觀察過程與杯中結果，再每次只改一個變數。指南區分來源數值、算術推導與編輯練習指引，並提供八份由淺入深的入門配方。每份配方會按現有步驟與作者教學標為「有教學指引」、「可練習配方」或「資料型配方」，不把資料較少的紀錄包裝成完整教學。

器材頁的「杯感與實際使用回饋」不是商品評分：只在找到具體公開實測／社群來源時列出清晰度、口感、流速或容錯差異，並保留來源連結；沒有足夠證據的器材不會硬填通用優缺點。整理方法見 [研究紀錄](docs/research.md)。

## 本機開發

使用 Node.js 24：

```sh
npm ci
npm run dev
```

開啟 `http://localhost:3000/brew-library/zh-Hant/`。架構、驗證及發布方式見 [開發文件](docs/architecture.md)。

本專案獨立整理，與配方作者及器材品牌並無隸屬關係。
