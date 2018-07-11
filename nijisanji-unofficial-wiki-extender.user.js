// ==UserScript==
// @name         にじさんじ非公式wiki Extender
// @namespace    https://github.com/abcang/nijisanji-unofficial-wiki-extender
// @version      0.1
// @description  にじさんじ非公式wikiを拡張するuserscript
// @author       abcang
// @match        https://wikiwiki.jp/nijisanji/*
// @run-at      document-end
// ==/UserScript==

(function() {
    'use strict';

    function main() {
        highlightAndDarken();
        setInterval(highlightAndDarken, 10 * 60 * 1000);

        const query = parseQuery();
        // ライバーの表があるページのみ有効
        if (location.pathname === '/nijisanji/%E9%85%8D%E4%BF%A1%E4%BA%88%E5%AE%9A%E3%83%AA%E3%82%B9%E3%83%88' ||
            (Object.keys(query).length === 0 && location.pathname === '%E9%85%8D%E4%BF%A1%E4%BA%88%E5%AE%9A')) {
            addHighlightCheckbox();
        }
    }

    class HighlightSetting {
        constructor() {
            this.livers = [
                // 1期生
                { key: 'tsukino_mito', name: '月ノ美兎' },
                { key: 'yuuki_chihiro', name: '勇気ちひろ' },
                { key: 'elu', name: 'える' },
                { key: 'higuchi_kaede', name: '樋口楓' },
                { key: 'shizuka_rin', name: '静凛' },
                { key: 'shibuya_hajime', name: '渋谷ハジメ' },
                { key: 'suzuya_aki', name: '鈴谷アキ' },
                { key: 'moira', name: 'モイラ' },
                // 2期生
                { key: 'suzuka_utako', name: '鈴鹿詩子' },
                { key: 'ushimi_ichigo', name: '宇志海いちご' },
                { key: 'ienaga_mugi', name: '家長むぎ' },
                { key: 'yuuhi_riri', name: '夕陽リリ' },
                { key: 'mononobe_alice', name: '物述有栖' },
                { key: 'noraneko', name: '文野環' },
                { key: 'hushimi_gaku', name: '伏見ガク' },
                { key: 'giruzaren3rd', name: 'ギルザレンIII世' },
                { key: 'kenmochi_touya', name: '剣持刀也' },
                { key: 'morinaka_kazaki', name: '森中花咲' },
                // ゲーマーズ
                { key: 'kanae', name: '叶' },
                { key: 'akabane_youko', name: '赤羽葉子' },
                { key: 'sasaki_saku', name: '笹木咲' },
                { key: 'yamiyono_moruru', name: '闇夜乃モルル' },
                { key: 'honma_himawari', name: '本間ひまわり' },
                // SEEDs
                { key: 'dola', name: 'ドーラ' },
                { key: 'umiyasyanokami', name: '海夜叉神' },
                { key: 'nakao_azuma', name: '名伽尾アズマ' },
                { key: 'izumo_kasumi', name: '出雲霞' },
                { key: 'todoroki_kyouko', name: '轟京子' },
                { key: 'sister_cleaire', name: 'シスター・クレア' },
                { key: 'hanabatake_chaika', name: '花畑チャイカ' },
                { key: 'yashiro_kizuku', name: '社築' },
                { key: 'azuchi_momo', name: '安土桃' },
                { key: 'suzuki_masaru', name: '鈴木勝' },
                { key: 'ryushen', name: '緑仙' },
                { key: 'uzuki_kou', name: '卯月コウ' },
                { key: 'hassaku_yuzu', name: '八朔ゆず' },
                // VOIZ
                { key: 'naruse_naru', name: '成瀬鳴' },
                { key: 'harusaki_air', name: '春崎エアル' },
                // COO
                { key: 'iwanaga', name: 'いわなが' },
            ];
            this.settingKey = 'nijisanji_unofficial_wiki_extender_highlight_livers';
            this.settings = new Set((localStorage.getItem(this.settingKey) || '').split(',').filter((key) => key));
        }

        findKeyByNamePrefix(name) {
            return this.livers.find((liver) => name.startsWith(liver.name));
        }

        isHighlight(key) {
            return this.settings.has(key);
        }

        enableHighlight(key) {
            this.settings.add(key);
            this.saveSettings();
        }

        disableHighlight(key) {
            this.settings.delete(key);
            this.saveSettings();
        }

        toggleHighlight(key) {
            if (this.isHighlight(key)) {
                this.disableHighlight(key);
            } else {
                this.enableHighlight(key);
            }
        }

        saveSettings() {
            try {
                localStorage.setItem(this.settingKey, Array.from(this.settings.values()).join(','));
            } catch (e) { console.error(e); }
        }

        getRegexp() {
            const livers = this.livers.filter(liver => this.isHighlight(liver.key)).map((liver) => liver.name);
            return livers.length > 0 ? new RegExp(livers.join('|')) : null;
        }
    }

    function highlightAndDarken() {
        const highlightColor = '#ffff00';
        const darkenHighlightColor = '#cccc00';
        const darkenColor = '#c0c0c0';
        const regexp = highlightSetting.getRegexp();

        // キーワードハイライト
        for (const li of Array.from(document.querySelectorAll('.minicalendar_viewer ul.list1 > li:not(.pcmt)'))) {
            const isHighlight = regexp && li.innerText.match(regexp);
            li.style.backgroundColor = isHighlight ? highlightColor : '';
        }

        // 本日の予定の配信時間が過ぎた予定を暗くする
        const now = new Date();
        for (const li of Array.from(document.querySelectorAll('table[summary="calendar frame"] ul.list1 > li'))) {
            const normalizedLi = li.cloneNode(true);
            Array.from(normalizedLi.querySelectorAll('del')).forEach((del) => { del.innerText = '' });
            const match = li.innerText.split('～')[0].match(/(\d{1,2})時(\d{1,2})分/);
            if (!match) {
                continue;
            }

            const isHighlight = regexp && li.innerText.match(regexp);
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(match[1]), Number(match[2]));
            if (date < now) {
                li.style.backgroundColor = isHighlight ? darkenHighlightColor : darkenColor;
            } else {
                li.style.backgroundColor = isHighlight ? highlightColor : '';
            }
        }
    }

    function createCheckbox(key) {
        const checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.checked = highlightSetting.isHighlight(key);
        checkbox.addEventListener('change', (event) => {
            highlightSetting.toggleHighlight(key);
            highlightAndDarken();
        });
        return checkbox;
    }

    function addHighlightCheckbox() {
        for (const tbody of Array.from(document.querySelectorAll('table.style_table > tbody'))) {
            const tr = tbody.querySelector('td').parentNode.cloneNode(true);
            tr.firstElementChild.innerText = 'ハイライト';

            for (const td of Array.from(tr.querySelectorAll('td'))) {
                const img = td.querySelector('img');
                const alt = img && img.getAttribute('alt');
                const liver = alt && highlightSetting.findKeyByNamePrefix(alt);

                td.innerText = '';
                if (liver) {
                    const checkbox = createCheckbox(liver.key);
                    td.appendChild(checkbox);
                }
            }

            tbody.appendChild(tr);
        }
    }

    function parseQuery() {
        if (!location.search) {
            return {};
        }

        return location.search.substring(1).split('&').reduce((obj, param) => {
            const [k, v] = param.split('=');
            obj[k] = v;
            return obj;
        }, {});
    }

    const highlightSetting = new HighlightSetting();
    main();
})();
