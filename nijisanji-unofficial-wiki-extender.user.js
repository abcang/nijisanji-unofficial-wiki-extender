// ==UserScript==
// @name         にじさんじ非公式wiki Extender
// @namespace    https://github.com/abcang/nijisanji-unofficial-wiki-extender
// @version      0.5.2
// @description  にじさんじ非公式wikiを拡張するuserscript
// @author       abcang
// @match        https://wikiwiki.jp/nijisanji/*
// @run-at      document-end
// ==/UserScript==

(function() {
    'use strict';

    const { highlightSetting, HighlightSetting } = createHighlightSetting();
    let hideOlder = true;
    let hideCalendar = true;
    let interval = null;

    initialize();

    function initialize() {
        highlightAll();

        // カレンダーのあるページだけで有効
        if (document.querySelector('table[summary="calendar frame"]')) {
            // カレンダーを隠す
            addButtonWrapper();
            ShapingData();
            applyDisplayCalendar();
            addCalendarToggleButton();
            addOlderToggleButton();

            highlightAndDarkenRecentSchedule();

            if (!interval) {
                interval = setInterval(() => {
                    reloadPage().then(() => initialize());
                }, 10 * 60 * 1000);
            }
        }

        // ライバーの表があるページのみ有効
        if ([
            '/nijisanji/',
            '/nijisanji/%E9%85%8D%E4%BF%A1%E4%BA%88%E5%AE%9A%E3%83%AA%E3%82%B9%E3%83%88', // 配信予定リスト
            '/nijisanji/%E9%85%8D%E4%BF%A1%E3%83%9A%E3%83%BC%E3%82%B8%20%E3%82%B8%E3%83%A3%E3%83%B3%E3%83%97%E3%83%AA%E3%82%B9%E3%83%88', // 配信ページ%20ジャンプリスト
        ].includes(location.pathname)) {
            createHighlightCheckbox();
        }
    }

    function createHighlightSetting() {
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

        HighlightSetting.HIGHLIGHT_COLOR = '#ffff00';
        HighlightSetting.DARKEN_HIGHLIGHT_COLOR = '#cccc00';
        HighlightSetting.DARKEN_COLOR = '#c0c0c0';

        return { HighlightSetting, highlightSetting: new HighlightSetting() };
    }

    function highlightAll() {
        const regexp = highlightSetting.getRegexp();

        for (const li of Array.from(document.querySelectorAll('.minicalendar_viewer ul.list1 > li:not(.pcmt)'))) {
            const isHighlight = regexp && li.innerText.match(regexp);
            li.style.backgroundColor = isHighlight ? HighlightSetting.HIGHLIGHT_COLOR : '';
        }
    }

    function ShapingData() {
        const target = document.querySelector('table[summary="calendar frame"]');
        const note = document.querySelector('.minicalendar_viewer > p');

        if (!target || !note) {
            return;
        }
        target.style.width = '100%';
        target.parentNode.insertBefore(note.cloneNode(true), target);

        const now = new Date();

        const targetTd = document.querySelector('table[summary="calendar frame"] > tbody > tr > td:last-child');
        targetTd.classList.add('minicalendar_viewer');
        targetTd.innerText = '';

        // 3時までは前日の情報も表示
        if (now.getHours() < 3) {
            const yesterdayDate = document.querySelector('#h2_content_1_2 + .date_weekday');
            const yesterdaySchedule = document.querySelector('#h2_content_1_1 + .date_weekday + .minicalendar_viewer ul');
            yesterdaySchedule.classList.add('ex-yesterday');
            targetTd.appendChild(yesterdayDate.cloneNode(true));
            targetTd.appendChild(yesterdaySchedule.cloneNode(true));
        }

        const todayDate = document.querySelector('#h2_content_1_1 + .date_weekday');
        const todaySchedule = document.querySelector('#h2_content_1_1 + .date_weekday + .minicalendar_viewer ul');
        todaySchedule.classList.add('ex-today');
        targetTd.appendChild(todayDate.cloneNode(true));
        targetTd.appendChild(todaySchedule.cloneNode(true));

        // 21時を超えている場合は翌日の情報も表示
        if (now.getHours() >= 21) {
            const tomorrowDate = document.querySelector('#h2_content_1_1 + .date_weekday + .minicalendar_viewer + .date_weekday');
            const tomorrowSchedule = document.querySelector('#h2_content_1_1 + .date_weekday + .minicalendar_viewer + .date_weekday + .minicalendar_viewer ul');
            targetTd.appendChild(tomorrowDate.cloneNode(true));
            targetTd.appendChild(tomorrowSchedule.cloneNode(true));
        }
    }

    function highlightAndDarkenRecentSchedule() {
        const regexp = highlightSetting.getRegexp();
        const now = new Date();
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const threeHoursAgo = (() => { const d = new Date(); return d.setHours(d.getHours() - 3)})();

        // 前日の予定を暗くする
        for (const li of Array.from(document.querySelectorAll('.ex-yesterday > li'))) {
            const isHighlight = regexp && li.innerText.match(regexp);
            const date = parseDate(li, yesterday);

            li.style.backgroundColor = isHighlight ? HighlightSetting.DARKEN_HIGHLIGHT_COLOR : HighlightSetting.DARKEN_COLOR;

            if (date) {
                li.style.display = (hideOlder && date < threeHoursAgo) ? 'none' : '';
            }
        }

        // 本日の予定の配信時間が過ぎた予定を暗くする
        for (const li of Array.from(document.querySelectorAll('.ex-today > li'))) {
            const isHighlight = regexp && li.innerText.match(regexp);
            const date = parseDate(li, now);

            if (date) {
                li.style.display = (hideOlder && date < threeHoursAgo) ? 'none' : '';

                if (date < now) {
                    li.style.backgroundColor = isHighlight ? HighlightSetting.DARKEN_HIGHLIGHT_COLOR : HighlightSetting.DARKEN_COLOR;
                    continue;
                }
            }

            li.style.backgroundColor = isHighlight ? HighlightSetting.HIGHLIGHT_COLOR : '';
        }
    }

    function createHighlightCheckbox() {
        function createCheckbox(key) {
            const checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.checked = highlightSetting.isHighlight(key);
            checkbox.addEventListener('change', (event) => {
                highlightSetting.toggleHighlight(key);
                highlightAll();
                highlightAndDarkenRecentSchedule();
            });
            return checkbox;
        }

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


    function addButtonWrapper() {
        const target = document.querySelector('table[summary="calendar frame"]');
        if (!target) {
            return;
        }

        const buttonWrapper = document.createElement('div');
        buttonWrapper.setAttribute('id', 'ex-button-wrapper');
        buttonWrapper.style.display = 'flex';
        buttonWrapper.style.justifyContent = 'space-between';
        buttonWrapper.appendChild(document.createElement('div'));
        buttonWrapper.appendChild(document.createElement('div'));
        target.parentNode.insertBefore(buttonWrapper, target);
    }

    function addOlderToggleButton() {
        function updateText(button) {
            button.setAttribute('value', hideOlder ? '配信時間を過ぎた予定を表示する' : '配信時間を過ぎた予定を隠す');
        }

        const button = document.createElement('input');
        button.setAttribute('type', 'button');
        updateText(button);
        button.addEventListener('click', (e) => {
            hideOlder = !hideOlder;
            updateText(e.target);
            highlightAndDarkenRecentSchedule();
        });

        const buttonWrapper = document.querySelector('#ex-button-wrapper > :last-child');
        buttonWrapper.appendChild(button);
    }

    function applyDisplayCalendar() {
        const calendar = document.querySelector('table[summary="calendar frame"] td');
        if (!calendar) {
            return;
        }

        calendar.style.display = hideCalendar ? 'none' : '';
    }

    function addCalendarToggleButton() {
        function updateText(button) {
            button.setAttribute('value', hideCalendar ? 'カレンダーを表示する' : 'カレンダーを隠す');
        }

        const button = document.createElement('input');
        button.setAttribute('type', 'button');
        updateText(button);
        button.addEventListener('click', (e) => {
            hideCalendar = !hideCalendar;
            updateText(e.target);
            applyDisplayCalendar();
        });

        const buttonWrapper = document.querySelector('#ex-button-wrapper > :first-child');
        buttonWrapper.appendChild(button);
    }

    function parseDate(li, base) {
        const normalizedLi = li.cloneNode(true);
        // 打ち消し線の内容を消す
        Array.from(normalizedLi.querySelectorAll('del')).forEach((del) => { del.innerText = '' });

        const match = normalizedLi.innerText.split('～')[0].match(/(\d{1,2})時(\d{1,2})分/);
        if (!match) {
            return null;
        }

        return new Date(base.getFullYear(), base.getMonth(), base.getDate(), Number(match[1]), Number(match[2]));
    }

    function reloadPage() {
        return fetch(location.href).then((res) => res.text()).then((bodyText) => {
            const parser = new DOMParser();
            const body = parser.parseFromString(bodyText, 'text/html');
            const target = document.querySelector("#body");

            target.innerText = '';
            for (const ele of Array.from(body.querySelector("#body").children)) {
                target.appendChild(ele);
            }

            const DOMContentLoaded_event = document.createEvent("Event");
            DOMContentLoaded_event.initEvent("DOMContentLoaded", true, true);
            window.document.dispatchEvent(DOMContentLoaded_event);
        });
    }
})();
