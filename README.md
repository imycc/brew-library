# 手沖配方庫 · Pour-over Coffee

一個免費、支援九語的手沖咖啡配方網站。

**目的：** 整理世界各地咖啡師與比賽的原版配方，讓大家按現有器材查找、閱讀沖煮步驟，並比較不同方法。每份配方保留原始來源、版本及核對日期；來源未提供的資料不自行補上。

☕ **[瀏覽配方庫](https://imycc.github.io/pour-over-coffee/zh-Hant/)**

## 一起補充資料

歡迎咖啡愛好者一起加入，毋須懂寫程式！你可以：

- 分享作者、官方頻道或合作品牌發布的配方與比賽影片。
- 補充器材資料、修正數值、回報失效連結。
- 協助翻譯、校對，讓更多人讀懂配方。

請開 [Issue](https://github.com/imycc/pour-over-coffee/issues/new) 提供資料，或直接提交 Pull Request。新增配方請附作者、器材、原始連結及可核實的參數／步驟；不同版本分開整理，未知條件明確標示。請用自己的文字摘要，避免整篇轉載。

配方資料位於 [`content/recipes.json`](content/recipes.json)，翻譯位於 [`messages/`](messages/)。整理準則及核對筆記見 [來源紀錄](docs/research.md)。

## 本機開發

使用 Node.js 24：

```sh
npm ci
npm run dev
```

開啟 `http://localhost:3000/pour-over-coffee/zh-Hant/`。架構、驗證及發布方式見 [開發文件](docs/architecture.md)。

本專案獨立整理，與配方作者及器材品牌並無隸屬關係。
