// ==UserScript==
// @name         にじさんじ非公式wiki Extender
// @namespace    https://github.com/abcang/nijisanji-unofficial-wiki-extender
// @version      0.8.5
// @description  にじさんじ非公式wikiを拡張するuserscript
// @author       abcang
// @match        https://wikiwiki.jp/nijisanji/*
// @updateURL    https://github.com/abcang/nijisanji-unofficial-wiki-extender/raw/master/nijisanji-unofficial-wiki-extender.user.js
// @downloadURL  https://github.com/abcang/nijisanji-unofficial-wiki-extender/raw/master/nijisanji-unofficial-wiki-extender.user.js
// @run-at      document-end
// ==/UserScript==

(function() {
    'use strict';

    const { highlightSetting, HighlightSetting } = createHighlightSetting();
    const { notificationTimeSetting, NotificationTimeSetting } = createNotificationTimeSetting();
    const notifySound = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjEyLjEwMAAAAAAAAAAAAAAA/+NAwAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABBQAPz8/Pz8/TExMTExMWVlZWVlZZmZmZmZmc3Nzc3Nzc4CAgICAgIyMjIyMjJmZmZmZmaampqampqazs7Ozs7PAwMDAwMDMzMzMzMzZ2dnZ2dnZ5ubm5ubm8/Pz8/Pz////////AAAAAExhdmM1OC4xOAAAAAAAAAAAAAAAACQDmgAAAAAAAAQU/8yg/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/jEMQACEAC0llBGAJuS2yEK4AMROD4OAgCAIAgD4P1gQEAQOFAfUIAxu8P0e8MhkM/////4xLEBgpiSsgBhaAA5M8j+McHbGzwHMQuXwMdGFLf//////////8oEh/5SGB/6YqlgADBAP/jEMQECUHy1ZvKmAMkA1N/////V8yFJAPsBbo4WSbS///////////69Qr4torAAAYTjiD/4xDEBgiJ8vG8OBoeAO66R4tEgIYNX6v+vtU2t//+rv13qUv///xHmqoAQK20brUkak8L/+MQxAoJqfLQeBAmHiQ1IKlf6v/tdt1V9f20Guvu72auqvX661fVx8m9AwiQCAAO9JIuk//jEsQKClHywF44KB5CEpBgdVNvq///7006CDLTrqd07M7M3////kyN//76lQMMkAd6SRiT/+MQxAgJgfLAWDgoHkK6GpgtBS+r/32T07rWuzWS9lKrXrW76m////IweoABRBsIDfSMSf/jEMQJB8Hy4RoQGh7CFF0Uf1f//+39JJFm+yta9Tf///KnBgE///V9/+6lnBrgkfwCoSX/4xDEEQfh9pAAqCVkgzVer///9X///QBDA7E1A/HAAoABZ////oU1IU6lLMBjgfQff3/r/+MSxBgHAfbEfmgVbOwXQceAAAZAAe8AFv/////5grhiJv6fV/a+/UVhn/+pAwACvAARb///4xDEJAbx9vG+UA9O////Wgbgliiof2/X9VrgZE3/pfllQDE3////1f1G4FBYfKXE29Dw/+MQxC8HIfKgXoAVTJAYDP+hgDE2zoLVb9v7BDiTtWtS+h/1f////t/2/6v0lnD50Mmtiv/jEMQ5BbHyfAKgD1AD5IBAAAp/QaAJBYooaCojAQqZCRI2LIH3s///+IoAwOiALQswsoH/4xLESQhZ8nwCoCBsB0eoWFQz6AZFRbULkcVFsWF2YqLVTEFNRTMuMTAwVVVVVVVVVVVVVf/jEMRPB3CywF4ICh5VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/4xDEWAdYMhQASYYEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
    const timers = [];
    let hideOlder = true;
    let hideCalendar = true;
    let interval = null;
    let canNotify = false;

    if (window.Notification) {
        if (Notification.permission === 'granted') {
            canNotify = true;
        }
    }

    initialize();

    function initialize() {
        highlightAll();

        const target = document.querySelector('table[summary="calendar frame"]');

        // カレンダーのあるページだけで有効
        if (target) {
            const [leftButton, rightButton] = createButtonWrappers(target);

            ShapingData();
            applyDisplayCalendar();
            leftButton.appendChild(createCalendarToggleButton());
            rightButton.appendChild(createNotificationSetting());
            rightButton.appendChild(createOlderToggleButton());

            highlightAndDarkenRecentSchedule();
            initializeNotificationTimer();

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
                    { key: 'tsukino_mito', name: '月ノ美兎', icon: '/nijisanji/?plugin=ref&page=月ノ美兎&src=tsukino_mito.jpg' },
                    { key: 'yuuki_chihiro', name: '勇気ちひろ', icon: '/nijisanji/?plugin=ref&page=勇気ちひろ&src=yuuki_chihiro.jpg' },
                    { key: 'elu', name: 'える', icon: '/nijisanji/?plugin=ref&page=える&src=elu.jpg' },
                    { key: 'higuchi_kaede', name: '樋口楓', icon: '/nijisanji/?plugin=ref&page=樋口楓&src=higuchi_kaede.jpg' },
                    { key: 'shizuka_rin', name: '静凛', icon: '/nijisanji/?plugin=ref&page=静凛&src=shizuka_rin.jpg' },
                    { key: 'shibuya_hajime', name: '渋谷ハジメ', icon: '/nijisanji/?plugin=ref&page=渋谷ハジメ&src=shibuya_hajime.jpg' },
                    { key: 'suzuya_aki', name: '鈴谷アキ', icon: '/nijisanji/?plugin=ref&page=鈴谷アキ&src=suzuya_aki.jpg' },
                    { key: 'moira', name: 'モイラ', icon: '/nijisanji/?plugin=ref&page=モイラ&src=moira.jpg' },
                    // 2期生
                    { key: 'suzuka_utako', name: '鈴鹿詩子', icon: '/nijisanji/?plugin=ref&page=鈴鹿詩子&src=suzuka_utako.jpg' },
                    { key: 'ushimi_ichigo', name: '宇志海いちご', icon: '/nijisanji/?plugin=ref&page=宇志海いちご&src=ushiumi_ichigo.jpg' },
                    { key: 'ienaga_mugi', name: '家長むぎ', icon: '/nijisanji/?plugin=ref&page=家長むぎ&src=ienaga_mugi.jpg' },
                    { key: 'yuuhi_riri', name: '夕陽リリ', icon: '/nijisanji/?plugin=ref&page=夕陽リリ&src=yuuhi_riri.jpg' },
                    { key: 'mononobe_alice', name: '物述有栖', icon: '/nijisanji/?plugin=ref&page=物述有栖&src=mononobe_alice.jpg' },
                    { key: 'noraneko', name: '文野環', icon: '/nijisanji/?plugin=ref&page=文野環&src=noraneko.jpg' },
                    { key: 'hushimi_gaku', name: '伏見ガク', icon: '/nijisanji/?plugin=ref&page=伏見ガク&src=hushimi_gaku.jpg' },
                    { key: 'giruzaren3rd', name: 'ギルザレンIII世', icon: '/nijisanji/?plugin=ref&page=ギルザレンIII世&src=giruzaren3rd.jpg' },
                    { key: 'kenmochi_touya', name: '剣持刀也', icon: '/nijisanji/?plugin=ref&page=剣持刀也&src=kenmochi_touya.jpg' },
                    { key: 'morinaka_kazaki', name: '森中花咲', icon: '/nijisanji/?plugin=ref&page=森中花咲&src=morinaka_kazaki_0.jpg' },
                    // ゲーマーズ
                    { key: 'kanae', name: '叶', icon: '/nijisanji/?plugin=ref&page=叶&src=kanae_0.jpg' },
                    { key: 'akabane_youko', name: '赤羽葉子', icon: '/nijisanji/?plugin=ref&page=赤羽葉子&src=ihTN2W2F_400x400.jpg' },
                    { key: 'sasaki_saku', name: '笹木咲', icon: '/nijisanji/?plugin=ref&page=笹木咲&src=foX-dRp6_400x400.jpg' },
                    { key: 'yamiyono_moruru', name: '闇夜乃モルル', icon: '/nijisanji/?plugin=ref&page=闇夜乃モルル&src=rnrrdark_400x400.jpg' },
                    { key: 'honma_himawari', name: '本間ひまわり', icon: '/nijisanji/?plugin=ref&page=本間ひまわり&src=honmahimawari_400x400.jpg' },
                    { key: 'ririmu', name: '魔界ノりりむ', icon: '/nijisanji/?plugin=ref&page=魔界ノりりむ&src=ririmu.jpg' },
                    { key: 'kuzuha', name: '葛葉', icon: '/nijisanji/?plugin=ref&page=葛葉&src=kuzuha.jpg' },
                    { key: 'setsuna', name: '雪汝', icon: '/nijisanji/?plugin=ref&page=雪汝&src=setsuna.jpg' },
                    { key: 'yuika', name: '椎名唯華', icon: '/nijisanji/?plugin=ref&page=椎名唯華&src=yuika.jpg' },
                    // SEEDs 1期生
                    { key: 'dola', name: 'ドーラ', icon: '/nijisanji/?plugin=ref&page=ドーラ&src=do-ra.png' },
                    { key: 'umiyasyanokami', name: '海夜叉神', icon: '/nijisanji/?plugin=ref&page=海夜叉神&src=kami.png' },
                    { key: 'nakao_azuma', name: '名伽尾アズマ', icon: '/nijisanji/?plugin=ref&page=名伽尾アズマ&src=azuma.png' },
                    { key: 'izumo_kasumi', name: '出雲霞', icon: '/nijisanji/?plugin=ref&page=出雲霞&src=izumo.png' },
                    { key: 'todoroki_kyouko', name: '轟京子', icon: '/nijisanji/?plugin=ref&page=轟京子&src=kyo.png' },
                    { key: 'sister_cleaire', name: 'シスター・クレア', icon: '/nijisanji/?plugin=ref&page=シスター・クレア&src=kurea.png' },
                    { key: 'hanabatake_chaika', name: '花畑チャイカ', icon: '/nijisanji/?plugin=ref&page=花畑チャイカ&src=chaika.png' },
                    { key: 'yashiro_kizuku', name: '社築', icon: '/nijisanji/?plugin=ref&page=社築&src=syatiku.png' },
                    { key: 'azuchi_momo', name: '安土桃', icon: '/nijisanji/?plugin=ref&page=安土桃&src=Adutimomo_400x400.jpg' },
                    { key: 'suzuki_masaru', name: '鈴木勝', icon: '/nijisanji/?plugin=ref&page=漆黒の捕食者D.E.%28鈴木勝%29&src=ZJvfgjbr_400x400.jpg' },
                    { key: 'ryushen', name: '緑仙', icon: '/nijisanji/?plugin=ref&page=緑仙&src=CQicycXP_400x400_0.jpg' },
                    { key: 'uzuki_kou', name: '卯月コウ', icon: '/nijisanji/?plugin=ref&page=卯月コウ&src=_v3TMKaM_400x400_1.jpg' },
                    { key: 'hassaku_yuzu', name: '八朔ゆず', icon: '/nijisanji/?plugin=ref&page=八朔ゆず&src=m3hTJp7B_400x400.jpg' },
                    // SEEDs 2期生
                    { key: 'kanda', name: '神田笑一', icon: '/nijisanji/?plugin=ref&page=神田笑一&src=kanda.jpg' },
                    { key: 'kogane', name: '鳴門こがね', icon: '/nijisanji/?plugin=ref&page=鳴門こがね&src=kogane.jpg' },
                    { key: 'hina', name: '飛鳥ひな', icon: '/nijisanji/?plugin=ref&page=飛鳥ひな&src=hina.jpg' },
                    { key: 'harusaki_air', name: '春崎エアル', icon: '/nijisanji/?plugin=ref&page=春崎エアル&src=harusaki.jpg' },
                    { key: 'sayo', name: '雨森小夜', icon: '/nijisanji/?plugin=ref&page=雨森小夜&src=sayo.jpg' },
                    { key: 'rion', name: '鷹宮リオン', icon: '/nijisanji/?plugin=ref&page=鷹宮リオン&src=rion.jpg' },
                    { key: 'keisuke', name: '舞元啓介', icon: '/nijisanji/?plugin=ref&page=舞元啓介&src=keisuke.jpg' },
                    { key: 'mikoto', name: '竜胆尊', icon: '/nijisanji/?plugin=ref&page=竜胆尊&src=mikoto.jpg' },
                    { key: 'debiru', name: 'でびでび・でびる', icon: '/nijisanji/?plugin=ref&page=でびでび・でびる&src=debiru.jpg' },
                    { key: 'ritsuki', name: '桜凛月', icon: '/nijisanji/?plugin=ref&page=桜凛月&src=ritsuki.jpg' },
                    { key: 'chima', name: '町田ちま', icon: '/nijisanji/?plugin=ref&page=町田ちま&src=chima.jpg' },
                    { key: 'shizuku', name: '月見しずく', icon: '/nijisanji/?plugin=ref&page=月見しずく&src=shizuku.jpg' },
                    { key: 'rikiichi', name: 'ジョー・力一', icon: '/nijisanji/?plugin=ref&page=ジョー・力一&src=rikiichi.jpg' },
                    { key: 'achikita', name: '遠北千南', icon: '/nijisanji/?plugin=ref&page=遠北千南&src=achikita.jpg' },
                    { key: 'naruse_naru', name: '成瀬鳴', icon: '/nijisanji/?plugin=ref&page=成瀬鳴&src=naruse.jpg' },
                    { key: 'Belmond', name: 'ベルモンド・バンデラス', icon: '/nijisanji/?plugin=ref&page=ベルモンド・バンデラス&src=Belmond.png' },
                    { key: 'yaguruma', name: '矢車りね', icon: '/?plugin=ref&page=矢車りね&src=yaguruma.jpg' },
                    { key: 'yumeoikakeru', name: '夢追翔', icon: '/?plugin=ref&page=夢追翔&src=yumeoikakeru.png' },
                    { key: 'kuroishiba', name: '黒井しば', icon: '/?plugin=ref&page=黒井しば&src=kuroishiba.jpg' },
                    // 統合以降(仮)
                    { key: 'meiji-', name: '童田明治', icon: '/nijisanji/?plugin=ref&page=童田明治&src=meiji-.jpg' },
                    { key: 'chitose', name: '久遠千歳', icon: '/nijisanji/?plugin=ref&page=久遠千歳&src=chitose.jpg' },
                    { key: 'mirei', name: '郡道美玲', icon: '/nijisanji/?plugin=ref&page=郡道美玲&src=mirei.png' },
                    { key: 'roa', name: '夢月ロア', icon: '/nijisanji/?plugin=ref&page=夢月ロア&src=roa.png' },
                    { key: 'onomachi_haruka', name: '小野町春香', icon: '/nijisanji/?plugin=ref&page=小野町春香&src=9hwa-L8B_400x400.jpg' },
                    { key: 'KataribeTsumugu', name: '語部紡', icon: '/nijisanji/?plugin=ref&page=語部紡&src=AwhzYezD_400x400.jpg' },
                    { key: 'seto_miyako', name: '瀬戸美夜子', icon: '/nijisanji/?plugin=ref&page=瀬戸美夜子&src=Vy0Ubnmy_400x400.jpg' },
                    { key: 'era', name: '御伽原江良', icon: '/nijisanji/?plugin=ref&page=御伽原江良&src=era.png' },
                    // その他
                    { key: 'iwanaga', name: 'いわなが', icon: '/nijisanji/?plugin=ref&page=いわながライブ&src=iwanaga.jpg' },
                ];
                this.settingKey = 'nijisanji_unofficial_wiki_extender_highlight_livers';
                this.settings = new Set((localStorage.getItem(this.settingKey) || '').split(',').filter((key) => key));
            }

            findByNamePrefix(name) {
                return this.livers.find((liver) => name.startsWith(liver.name));
            }

            findByName(name) {
                return this.livers.find((liver) => name === liver.name);
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

    function createNotificationTimeSetting() {
        class NotificationTimeSetting {
            constructor() {
                this.settingKey = 'nijisanji_unofficial_wiki_extender_notification_time';
                this.time = Number(localStorage.getItem(this.settingKey) || '10');
            }

            getTime() {
                return this.time;
            }

            setTime(time) {
                this.time = Number(time);
                this.saveSettings();
            }

            saveSettings() {
                try {
                    localStorage.setItem(this.settingKey, this.time);
                } catch (e) { console.error(e); }
            }
        }

        return { NotificationTimeSetting, notificationTimeSetting: new NotificationTimeSetting() };
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
            const yesterdayDate = document.querySelector('#h2_content_1_2 + h3').cloneNode(true);
            targetTd.appendChild(yesterdayDate);
            for (const yesterdaySchedule of Array.from(document.querySelectorAll('#h2_content_1_2 + h3 + .minicalendar_viewer > ul'))) {
                const newYesterdaySchedule = yesterdaySchedule.cloneNode(true);
                newYesterdaySchedule.classList.add('ex-yesterday');
                targetTd.appendChild(newYesterdaySchedule);
            }
        }

        const todayDate = document.querySelector('#h2_content_1_1 + h3').cloneNode(true);
        targetTd.appendChild(todayDate);
        for (const yesterdaySchedule of Array.from(document.querySelectorAll('#h2_content_1_1 + h3 + .minicalendar_viewer > ul'))) {
            const newTodaySchedule = yesterdaySchedule.cloneNode(true);
            newTodaySchedule.classList.add('ex-today');
            targetTd.appendChild(newTodaySchedule);
        }

        // 21時を超えている場合は翌日の情報も表示
        if (now.getHours() >= 21) {
            const tomorrowDate = document.querySelector('#h2_content_1_1 + h3 + .minicalendar_viewer + h3').cloneNode(true);
            targetTd.appendChild(tomorrowDate);
            for (const yesterdaySchedule of Array.from(document.querySelectorAll('#h2_content_1_1 + h3 + .minicalendar_viewer + h3 + .minicalendar_viewer > ul'))) {
                const newTomorrowSchedule = yesterdaySchedule.cloneNode(true);
                newTomorrowSchedule.classList.add('ex-tomorrow');
                targetTd.appendChild(newTomorrowSchedule);
            }
        }
    }

    function initializeNotificationTimer() {
        while (timers.length > 0) {
            const timer = timers.shift();
            clearTimeout(timer);
        }

        if (!canNotify) {
            return;
        }

        const regexp = highlightSetting.getRegexp();

        if (!regexp) {
            return;
        }

        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        for (const li of Array.from(document.querySelectorAll('.ex-today > li'))) {
            const innerText = normalizedElementText(li);
            const match = innerText.match(regexp);
            const date = parseDate(li, now);

            if (match && date) {
                date.setMinutes(date.getMinutes() - notificationTimeSetting.getTime());
                if (date > now) {
                    registerNotification(match[0], innerText, date - now);
                }
            }
        }

        for (const li of Array.from(document.querySelectorAll('.ex-tomorrow > li'))) {
            const innerText = normalizedElementText(li);
            const match = innerText.match(regexp);
            const date = parseDate(li, tomorrow);

            if (match && date) {
                date.setMinutes(date.getMinutes() - notificationTimeSetting.getTime());
                if (date > now) {
                    registerNotification(match[0], innerText, date - now);
                }
            }
        }
    }

    function registerNotification(name, body, miliseconds) {
        const liver = highlightSetting.findByName(name);
        const icon = liver ? liver.icon : '';

        timers.push(setTimeout(() => {
            new Notification(name, { icon, body });
            notifySound.play();
        }, miliseconds));
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
                initializeNotificationTimer();
            });
            return checkbox;
        }

        for (const tbody of Array.from(document.querySelectorAll('table.style_table > tbody'))) {
            const tr = tbody.querySelector('td').parentNode.cloneNode(true);
            tr.firstElementChild.innerText = 'ハイライト';

            for (const td of Array.from(tr.querySelectorAll('td'))) {
                const img = td.querySelector('img');
                const alt = img && img.getAttribute('alt');
                const liver = alt && highlightSetting.findByNamePrefix(alt);

                td.innerText = '';
                if (liver) {
                    const checkbox = createCheckbox(liver.key);
                    td.appendChild(checkbox);
                }
            }

            tbody.appendChild(tr);
        }
    }


    function createButtonWrappers(target) {
        const leftButton = document.createElement('div');
        const rightButton = document.createElement('div');

        leftButton.style.display = 'flex';
        rightButton.style.display = 'flex';

        const buttonWrapper = document.createElement('div');
        buttonWrapper.setAttribute('id', 'ex-button-wrapper');
        buttonWrapper.style.display = 'flex';
        buttonWrapper.style.justifyContent = 'space-between';
        buttonWrapper.appendChild(leftButton);
        buttonWrapper.appendChild(rightButton);
        target.parentNode.insertBefore(buttonWrapper, target);

        return [leftButton, rightButton];
    }

    function createOlderToggleButton() {
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

        return button;
    }

    function createNotificationSetting() {
        const notificationSetting = document.createElement('div');

        function initializeNotificationSetting() {
            notificationSetting.innerText = '';

            if (canNotify) {
                const selector = document.createElement('select');
                const selectedTime = notificationTimeSetting.getTime();
                for (const time of [5, 10, 15, 20]) {
                    const option = document.createElement('option');
                    option.innerText = `${time}分前に通知`;
                    option.setAttribute('value', time);
                    selector.appendChild(option);
                    if (time === selectedTime) {
                        option.setAttribute('selected', 'selected');
                    }
                }

                selector.addEventListener('change', function() {
                    const index = this.selectedIndex;
                    const value = this.options[index].value;
                    notificationTimeSetting.setTime(value);
                    initializeNotificationTimer();
                });
                notificationSetting.appendChild(selector);
            } else {
                const enableButton = document.createElement('input');
                enableButton.setAttribute('type', 'button');
                enableButton.setAttribute('value', '通知を有効化する');

                enableButton.addEventListener('click', () => {
                    if (Notification.permission !== 'denied') {
                        Notification.requestPermission((permission) => {
                            if (permission === 'granted') {
                                canNotify = true;
                                initializeNotificationTimer();
                                initializeNotificationSetting();
                            }
                        });
                    } else {
                        alert('通知がブロックされています。ブラウザの設定を変更して通知を有効化してください。');
                    }
                });

                notificationSetting.appendChild(enableButton);
            }
        }

        initializeNotificationSetting();

        return notificationSetting;
    }

    function applyDisplayCalendar() {
        const calendar = document.querySelector('table[summary="calendar frame"] td');
        if (!calendar) {
            return;
        }

        calendar.style.display = hideCalendar ? 'none' : '';
    }

    function createCalendarToggleButton() {
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

        return button;
    }

    function normalizedElementText(ele) {
        const normalizedElement = ele.cloneNode(true);
        // 打ち消し線の内容を消す
        Array.from(normalizedElement.querySelectorAll('del')).forEach((del) => { del.innerText = '' });

        return normalizedElement.innerText;
    }

    function parseDate(li, base) {
        const match = normalizedElementText(li).split('～')[0].match(/(\d{1,2})時(\d{1,2})分/);
        if (!match) {
            return null;
        }

        return new Date(base.getFullYear(), base.getMonth(), base.getDate(), Number(match[1]), Number(match[2]));
    }

    function reloadPage() {
        return new Promise((resolve, reject) => {
            // 通知タイミングちょうどにリロードしないようにずらす
            const seconds = (new Date()).getSeconds();
            if (seconds < 10) {
                setTimeout(resolve, 10 - seconds);
            } else if (seconds >= 10 && seconds < 50) {
                resolve();
            } else {
                setTimeout(resolve, 70 - seconds);
            }
        }).then(() => {
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
        });
    }
})();
