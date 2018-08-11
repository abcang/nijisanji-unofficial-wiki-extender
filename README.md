# nijisanji-unofficial-wiki-extender
[にじさんじ非公式wikiの配信スケジュールページ](https://wikiwiki.jp/nijisanji/%E9%85%8D%E4%BF%A1%E4%BA%88%E5%AE%9A%E3%83%AA%E3%82%B9%E3%83%88)を拡張するuserscript

あらかじめ[Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=ja)もしくは[Greasemonkey](https://addons.mozilla.org/ja/firefox/addon/greasemonkey/)をインストールしてください。

[インストール](https://github.com/abcang/nijisanji-unofficial-wiki-extender/raw/master/nijisanji-unofficial-wiki-extender.user.js)

## 機能
- 選択したライバーの配信予定をハイライト
- ハイライト対象のユーザーの配信n分前に通知
  - **ブラウザとページを開いたままにしておかないと通知されないので注意**
  - ページ表示後にページ内のどこかをクリックしないと通知音が鳴らない問題があります
- 10分おきに最新情報を更新
- 直近の配信予定が見やすくなる
  - 配信時間が過ぎたものは背景が暗くなる
  - 配信時刻から3時間過ぎた予定は隠す
  - 0時の前後3時間の場合、本日の予定の欄に前日や翌日の情報も表示
- カレンダーを非表示
