(function () {
  const UNIVERSITIES = window.UNI_COMPASS_DATA || [];
  const STORAGE_KEY_SHORTLIST = 'yangfan_shortlist_v1';
  const STORAGE_KEY_TRACK = 'yangfan_track_v1';
  const PUBLIC_BASE_URL = 'https://charliebu02.github.io/yangfan-haiben/';

  const TRACK_META = {
    gaokao: { label: '🇨🇳 高考普高', short: '高考' },
    alevel: { label: '🇬🇧 A-Level', short: 'A-Level' },
    ib:     { label: 'IB 体系', short: 'IB' },
    ap:     { label: '🇺🇸 AP 体系', short: 'AP' },
    ossd:   { label: '🇨🇦 OSSD', short: 'OSSD' }
  };

  // 分数筛选档位（紧随课程体系切换）
  const SCORE_TIERS = {
    gaokao: [
      { code: 'ALL', label: '不限分数' },
      { code: 'GK_670', label: '670分+ (超一本140分+ / 省前0.5%)' },
      { code: 'GK_630', label: '630–669分 (超一本100–139分)' },
      { code: 'GK_590', label: '590–629分 (超一本60–99分 / 80%+)' },
      { code: 'GK_540', label: '一本线–589分 (或高中均分75%+)' }
    ],
    alevel: [
      { code: 'ALL', label: '不限等级' },
      { code: 'AL_A2S', label: 'A*A*A – A*A*A*' },
      { code: 'AL_A1S', label: 'A*AA – AAA' },
      { code: 'AL_AAB', label: 'AAB – ABB' },
      { code: 'AL_BBB', label: 'BBB 及以下' }
    ],
    ib: [
      { code: 'ALL', label: '不限总分' },
      { code: 'IB_40', label: '40 – 45 分' },
      { code: 'IB_37', label: '37 – 39 分' },
      { code: 'IB_34', label: '34 – 36 分' },
      { code: 'IB_30', label: '28 – 33 分' }
    ],
    ap: [
      { code: 'ALL', label: '不限成绩' },
      { code: 'AP_1530', label: 'GPA 3.9+ / SAT 1530+ / 5门AP' },
      { code: 'AP_1450', label: 'GPA 3.7+ / SAT 1450+ / 3-4门AP' },
      { code: 'AP_1350', label: 'GPA 3.4+ / SAT 1350+ (或免SAT)' },
      { code: 'AP_30', label: 'GPA 3.0+ / 免SAT直申' }
    ],
    ossd: [
      { code: 'ALL', label: '不限均分' },
      { code: 'OSSD_92', label: '6门 4U/M 均分 92%+' },
      { code: 'OSSD_88', label: '均分 88% – 91%' },
      { code: 'OSSD_83', label: '均分 83% – 87%' },
      { code: 'OSSD_78', label: '均分 78% – 82%' }
    ]
  };

  const REGION_META = {
    HK: { label: '🇭🇰 中国香港', flag: '🇭🇰', short: '香港', tint: '#FFF1F2' },
    SG: { label: '🇸🇬 新加坡', flag: '🇸🇬', short: '新加坡', tint: '#ECFDF5' },
    UK: { label: '🇬🇧 英国', flag: '🇬🇧', short: '英国', tint: '#EFF6FF' },
    US: { label: '🇺🇸 美国', flag: '🇺🇸', short: '美国', tint: '#F5F3FF' },
    CA: { label: '🇨🇦 加拿大', flag: '🇨🇦', short: '加拿大', tint: '#FFF7ED' },
    AU: { label: '🇦🇺 澳大利亚', flag: '🇦🇺', short: '澳洲', tint: '#ECFEFF' }
  };

  const SCHOOL_PASTELS = [
    { bg: '#FFE4E6', text: '#9F1239' },
    { bg: '#D1FAE5', text: '#065F46' },
    { bg: '#E0F2FE', text: '#075985' },
    { bg: '#EDE9FE', text: '#5B21B6' },
    { bg: '#FEF3C7', text: '#92400E' },
    { bg: '#FFEDD5', text: '#9A3412' },
    { bg: '#CFFAFE', text: '#155E75' },
    { bg: '#ECFCCB', text: '#3F6212' }
  ];

  // 原版 12 个月完整保留
  const SEASON_MONTHS = [
    { month: 8,  num: '8月',     en: 'AUG', phase: '网申开放' },
    { month: 9,  num: '9月',     en: 'SEP', phase: '早申准备' },
    { month: 10, num: '10月',    en: 'OCT', phase: '牛剑截止' },
    { month: 11, num: '11月',    en: 'NOV', phase: '早申高峰' },
    { month: 12, num: '12月',    en: 'DEC', phase: '早申放榜' },
    { month: 1,  num: '次年1月', en: 'JAN', phase: '常规截止' },
    { month: 2,  num: '次年2月', en: 'FEB', phase: '新国大截止' },
    { month: 3,  num: '次年3月', en: 'MAR', phase: '春季放榜' },
    { month: 4,  num: '次年4月', en: 'APR', phase: '集中放榜' },
    { month: 5,  num: '次年5月', en: 'MAY', phase: '定校大考' },
    { month: 6,  num: '次年6月', en: 'JUN', phase: '高考通道' },
    { month: 7,  num: '次年7月', en: 'JUL', phase: '实考补交' }
  ];

  const state = {
    activeView: 'directory',
    detailUniId: null,
    activeTrack: 'gaokao',
    scoreFilter: 'ALL',
    selectedRegions: new Set(['ALL']),
    langFilter: 'ALL',
    searchQuery: '',
    acceptedOnly: false,
    shortlist: new Set(),
    imageShape: 'long', // 'long' (长图，默认打开) | 'square' (方图)
    shareLinkTab: 'url' // 'url' (网址) | 'qr' (二维码)
  };

  function getSchoolPastel(uniId) {
    const arr = Array.from(state.shortlist);
    const idx = arr.indexOf(uniId);
    const paletteIdx = idx >= 0 ? idx % SCHOOL_PASTELS.length : 0;
    return SCHOOL_PASTELS[paletteIdx];
  }

  function parseMinIelts(overallStr) {
    const m = String(overallStr || '').match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 6.5;
  }

  function matchLangFilter(uni, filterCode) {
    if (filterCode === 'ALL') return true;
    const minIelts = parseMinIelts(uni.language?.ielts?.overall);
    if (filterCode === 'GAOKAO_ENG') {
      const txt = `${uni.language?.waiver_policy || ''} ${uni.tracks?.gaokao?.subject_reqs || ''} ${uni.tracks?.gaokao?.notes || ''}`;
      return (uni.region === 'HK' && uni.tracks?.gaokao?.accepted) || /高考英语|免雅思/.test(txt);
    }
    if (filterCode === 'IELTS_60') return minIelts <= 6.0;
    if (filterCode === 'IELTS_65') return minIelts <= 6.5;
    if (filterCode === 'IELTS_70') return minIelts <= 7.0;
    if (filterCode === 'DET') return Boolean(uni.language?.duolingo?.accepted);
    return true;
  }

  function matchScoreFilter(uni, track, scoreCode) {
    if (!scoreCode || scoreCode === 'ALL') return true;
    const tObj = uni.tracks?.[track];
    if (!tObj) return false;
    const headline = String(tObj.headline || '');
    const bestRank = Math.min(uni.rankings?.qs || 999, uni.rankings?.usnews || 999);

    if (track === 'gaokao') {
      if (!tObj.accepted) return false;
      const overMatch = headline.match(/超(?:特控\/)?一本线?\s*(\d+)/);
      const pctMatch = headline.match(/(\d{2})%/);
      let minScore = 600;
      if (/前\s*0\.[1-5]%/.test(headline) || ['cambridge', 'nus', 'ntu', 'hku', 'cuhk', 'hkust'].includes(uni.id)) {
        minScore = 665;
      } else if (overMatch) {
        minScore = 520 + parseInt(overMatch[1], 10);
      } else if (pctMatch) {
        const pct = parseInt(pctMatch[1], 10);
        minScore = Math.round((pct / 100) * 750);
      } else if (/一本线/.test(headline)) {
        minScore = 540;
      }
      if (scoreCode === 'GK_670') return true;
      if (scoreCode === 'GK_630') return minScore <= 655;
      if (scoreCode === 'GK_590') return minScore <= 620;
      if (scoreCode === 'GK_540') return minScore <= 585;
      return true;
    }

    if (track === 'alevel') {
      if (scoreCode === 'AL_A2S') return true;
      const needsA2S = /A\*A\*A/.test(headline) && !/AAA|AAB|ABB/.test(headline);
      const needsA1S = /A\*AA|AAA/.test(headline) && !/AAB|ABB|BBB/.test(headline);
      const needsAAB = /AAB|ABB/.test(headline) && !/BBB|BBC/.test(headline);
      if (scoreCode === 'AL_A1S') return !needsA2S;
      if (scoreCode === 'AL_AAB') return !needsA2S && !needsA1S;
      if (scoreCode === 'AL_BBB') return !needsA2S && !needsA1S && !needsAAB;
      return true;
    }

    if (track === 'ib') {
      const nums = (headline.match(/\b(2[4-9]|3[0-9]|4[0-5])\b/g) || []).map(Number);
      const minIb = nums.length ? Math.min(...nums) : (bestRank <= 15 ? 39 : bestRank <= 40 ? 36 : 32);
      if (scoreCode === 'IB_40') return true;
      if (scoreCode === 'IB_37') return minIb <= 39;
      if (scoreCode === 'IB_34') return minIb <= 36;
      if (scoreCode === 'IB_30') return minIb <= 33;
      return true;
    }

    if (track === 'ap') {
      const satNums = (headline.match(/\b(1[2-5]\d0)\b/g) || []).map(Number);
      const minSat = satNums.length ? Math.min(...satNums) : (bestRank <= 20 ? 1500 : bestRank <= 45 ? 1420 : 1320);
      const testFree = /Test-Blind|Test-Optional|免SAT|无需SAT/i.test(headline + ' ' + (tObj.standardized_test || ''));
      if (scoreCode === 'AP_1530') return true;
      if (scoreCode === 'AP_1450') return minSat <= 1490 || bestRank > 15;
      if (scoreCode === 'AP_1350') return minSat <= 1410 || testFree || uni.region !== 'US';
      if (scoreCode === 'AP_30') return minSat <= 1340 || testFree || ['AU', 'CA'].includes(uni.region);
      return true;
    }

    if (track === 'ossd') {
      const pcts = (headline.match(/(\d{2})%/g) || []).map(s => parseInt(s, 10));
      const minPct = pcts.length ? Math.min(...pcts) : 85;
      if (scoreCode === 'OSSD_92') return true;
      if (scoreCode === 'OSSD_88') return minPct <= 90;
      if (scoreCode === 'OSSD_83') return minPct <= 86;
      if (scoreCode === 'OSSD_78') return minPct <= 82;
      return true;
    }

    return true;
  }

  function getShareableUrl() {
    const base = window.location.protocol.startsWith('http') && !window.location.hostname.includes('127.0.0.1') && !window.location.hostname.includes('localhost')
      ? `${window.location.origin}${window.location.pathname}`
      : PUBLIC_BASE_URL;
    const url = new URL(base);
    url.searchParams.set('track', state.activeTrack);
    if (state.scoreFilter !== 'ALL') url.searchParams.set('score', state.scoreFilter);
    if (state.shortlist.size > 0) url.searchParams.set('list', Array.from(state.shortlist).slice(0, 10).join(','));
    return url.toString();
  }

  function initState() {
    document.getElementById('totalUniBadge').textContent = `${UNIVERSITIES.length}校`;

    const params = new URLSearchParams(window.location.search);
    const urlTrack = params.get('track');
    const urlScore = params.get('score');
    const urlList = params.get('list');
    const urlView = params.get('view');
    const urlUni = params.get('uni');

    if (urlTrack && TRACK_META[urlTrack]) {
      state.activeTrack = urlTrack;
    } else {
      const savedTrack = localStorage.getItem(STORAGE_KEY_TRACK);
      if (savedTrack && TRACK_META[savedTrack]) state.activeTrack = savedTrack;
    }

    if (urlScore) {
      state.scoreFilter = urlScore;
    }

    if (urlList) {
      const ids = urlList.split(',').map(s => s.trim()).filter(Boolean);
      state.shortlist = new Set(ids.filter(id => UNIVERSITIES.some(u => u.id === id)));
      saveShortlist();
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_SHORTLIST);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.shortlist = new Set(parsed.filter(id => UNIVERSITIES.some(u => u.id === id)));
        } else {
          state.shortlist = new Set(['hku', 'nus', 'ucl', 'cornell', 'uoft', 'usyd']);
          saveShortlist();
        }
      } catch (e) {
        state.shortlist = new Set(['hku', 'nus', 'ucl', 'cornell', 'uoft', 'usyd']);
      }
    }

    if (urlUni && UNIVERSITIES.some(u => u.id === urlUni)) {
      state.activeView = 'detail';
      state.detailUniId = urlUni;
    } else if (urlView === 'timeline') {
      state.activeView = 'timeline';
    }
  }

  function saveShortlist() {
    try { localStorage.setItem(STORAGE_KEY_SHORTLIST, JSON.stringify(Array.from(state.shortlist))); } catch (e) {}
  }

  function saveTrack() {
    try { localStorage.setItem(STORAGE_KEY_TRACK, state.activeTrack); } catch (e) {}
  }

  function showToast(message) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.add('hidden'), 2600);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function extractShortDate(exactDesc, monthNum) {
    const m = String(exactDesc || '').match(/(\d{1,2}月\d{1,2}日)/);
    if (m) return m[1];
    const m2 = String(exactDesc || '').match(/(上旬|中旬|下旬|月底|月初)/);
    if (m2) return `${monthNum}月${m2[1]}`;
    return `${monthNum}月`;
  }

  function getFilteredUniversities() {
    const q = state.searchQuery.trim().toLowerCase();
    return UNIVERSITIES.filter(uni => {
      if (!state.selectedRegions.has('ALL') && !state.selectedRegions.has(uni.region)) return false;
      const trackObj = uni.tracks[state.activeTrack];
      if (state.acceptedOnly && (!trackObj || !trackObj.accepted)) return false;
      if (!matchScoreFilter(uni, state.activeTrack, state.scoreFilter)) return false;
      if (!matchLangFilter(uni, state.langFilter)) return false;
      if (q) {
        const haystack = [uni.name_zh, uni.name_en, uni.short_name, uni.city, trackObj ? trackObj.headline : ''].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  function renderScoreFilterRow() {
    const container = document.getElementById('scorePillsContainer');
    if (!container) return;
    const tiers = SCORE_TIERS[state.activeTrack] || SCORE_TIERS.gaokao;
    if (!tiers.some(t => t.code === state.scoreFilter)) {
      state.scoreFilter = 'ALL';
    }
    container.innerHTML = tiers.map(t => `
      <button
        class="pill-btn ${t.code === state.scoreFilter ? 'active' : ''}"
        data-score="${escapeHtml(t.code)}"
        type="button"
      >${escapeHtml(t.label)}</button>
    `).join('');

    const activeTier = tiers.find(t => t.code === state.scoreFilter) || tiers[0];
    const scoreLabelEl = document.getElementById('activeScoreLabel');
    if (scoreLabelEl) scoreLabelEl.textContent = activeTier.label;
  }

  function renderDirectory() {
    const grid = document.getElementById('uniCardsGrid');
    const countEl = document.getElementById('visibleUniCount');
    const navCountEl = document.getElementById('visibleCountNav');
    const trackLabelEl = document.getElementById('activeTrackLabel');

    const list = getFilteredUniversities();
    countEl.textContent = list.length;
    if (navCountEl) navCountEl.textContent = list.length;
    if (trackLabelEl) trackLabelEl.textContent = TRACK_META[state.activeTrack].label;

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;background:#fff;border:2px solid #1E293B;border-radius:16px;padding:2.5rem;text-align:center;">
          <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:0.4rem;">当前筛选条件下暂无匹配大学</h3>
          <p style="font-size:0.84rem;color:#64748B;">请尝试切换其他分数段或点击右上角「重置筛选」</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map((uni) => {
      const rMeta = REGION_META[uni.region] || { flag: '', tint: '#F0F9FF' };
      const trackInfo = uni.tracks[state.activeTrack];
      const inList = state.shortlist.has(uni.id);
      const officialReqUrl = state.activeTrack === 'gaokao' ? uni.deep_links.gaokao_channel : uni.deep_links.intl_qualifications;
      const rankBadge = uni.rankings?.qs ? `QS #${uni.rankings.qs}` : (uni.rankings?.usnews ? `USN #${uni.rankings.usnews}` : '');

      return `
        <article
          class="uni-card ${inList ? 'in-shortlist' : ''}"
          data-action="open-detail"
          data-id="${escapeHtml(uni.id)}"
        >
          <div class="card-top-row">
            <div class="uni-name-wrap">
              <h2 class="uni-name-zh">
                <span>${rMeta.flag}</span>
                <span>${escapeHtml(uni.name_zh)}</span>
              </h2>
              ${rankBadge ? `<span class="uni-rank-sticker">${escapeHtml(rankBadge)}</span>` : ''}
            </div>

            <button
              class="btn-shortlist-mini ${inList ? 'added' : ''}"
              data-action="toggle-shortlist"
              data-id="${escapeHtml(uni.id)}"
              type="button"
            >${inList ? '✓ 已加入' : '+ 日历'}</button>
          </div>

          <div class="card-body-inner">
            <div class="card-req-line ${trackInfo.accepted ? '' : 'not-accepted'}" style="${trackInfo.accepted ? `background:${rMeta.tint};` : ''}">
              <div style="font-weight:800;color:#1E293B;margin-bottom:0.2rem;">${escapeHtml(trackInfo.headline)}</div>
              ${trackInfo.subject_reqs ? `<div style="font-size:0.78rem;font-weight:600;color:#475569;">先修选科：${escapeHtml(trackInfo.subject_reqs)}</div>` : ''}
            </div>

            ${uni.special_channels ? `<div class="card-special-channel"><strong>专项/补充通道：</strong>${escapeHtml(uni.special_channels)}</div>` : ''}

            <div class="card-bottom-row">
              <span class="card-lang-text">
                雅思 ${escapeHtml(uni.language.ielts.overall)} (${escapeHtml(uni.language.ielts.subscore)}) · 托福 ${escapeHtml(uni.language.toefl.overall)}
              </span>

              <div class="card-links-group" data-action="stop-prop">
                <a class="card-direct-link" href="${escapeHtml(officialReqUrl)}" target="_blank" rel="noopener noreferrer">官网要求 ↗</a>
                <a class="card-direct-link sec" href="${escapeHtml(uni.deep_links.deadlines_and_fees)}" target="_blank" rel="noopener noreferrer">截止 ↗</a>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderDetailPage() {
    const container = document.getElementById('detailPageContent');
    const uni = UNIVERSITIES.find(u => u.id === state.detailUniId);
    if (!uni) {
      state.activeView = 'directory';
      renderAll();
      return;
    }

    const rMeta = REGION_META[uni.region] || { label: uni.region, flag: '' };
    const inList = state.shortlist.has(uni.id);
    const activeTrackInfo = uni.tracks[state.activeTrack];

    const allTracksRows = Object.entries(TRACK_META).map(([key, meta]) => {
      const t = uni.tracks[key];
      const isCur = key === state.activeTrack;
      return `
        <tr style="${isCur ? 'background:#FEF9C3;' : ''}">
          <td style="font-weight:800;white-space:nowrap;">${meta.label}</td>
          <td style="white-space:nowrap;color:${t.accepted ? '#059669' : '#DC2626'};font-weight:800;">
            ${t.accepted ? '接受直申' : '需预科/转轨'}
          </td>
          <td>
            <div style="font-weight:800;color:#1E293B;margin-bottom:0.2rem;">${escapeHtml(t.headline)}</div>
            ${t.subject_reqs ? `<div style="font-size:0.8rem;color:#475569;">必修与选科：${escapeHtml(t.subject_reqs)}</div>` : ''}
            ${t.standardized_test ? `<div style="font-size:0.8rem;color:#475569;">标化与笔面试：${escapeHtml(t.standardized_test)}</div>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    const timelineHtml = (uni.timeline || []).map(node => `
      <div class="detail-info-item">
        <strong style="font-weight:800;color:#1E3A8A;">${escapeHtml(node.round_name)}（${escapeHtml(node.exact_date_desc)}）</strong>
        <span>${escapeHtml(node.conflict_warning || '官方关键申请节点')}</span>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="detail-unified-sheet">
        <div class="detail-top-bar">
          <button id="btnBackToDirectory" class="btn-back" type="button">← 返回院校列表</button>
          <button id="btnDetailToggleShortlist" class="btn ${inList ? 'btn-poster' : 'btn-subtle-light'}" type="button">
            ${inList ? '✓ 已在选校日历中（点击移除）' : '+ 加入我的选校日历'}
          </button>
        </div>

        <div class="detail-hero-section">
          <div>
            <div style="font-size:0.84rem;color:#1E293B;font-weight:800;margin-bottom:0.35rem;">
              ${rMeta.label} · ${escapeHtml(uni.city)}
              ${uni.rankings.qs ? ` · QS 世界排名 #${uni.rankings.qs}` : ''}
              ${uni.rankings.usnews ? ` · U.S. News #${uni.rankings.usnews}` : ''}
            </div>
            <h1 class="detail-title-zh">${escapeHtml(uni.name_zh)}</h1>
            <div class="detail-title-en">${escapeHtml(uni.name_en)} (${escapeHtml(uni.short_name)})</div>
            <p class="detail-intro-text">${escapeHtml(uni.intro || '')}</p>
            <div class="detail-meta-strip">
              <span>申请通道：${escapeHtml(uni.application_portal)}</span>
              <span>学费参考：${escapeHtml(uni.tuition_estimate)}</span>
              <span>热门方向：${escapeHtml(uni.popular_majors_note)}</span>
            </div>
          </div>
        </div>

        <div class="detail-block">
          <div class="detail-block-title">官方申请要求与截止日期直达链接</div>
          <div class="detail-links-row">
            <a class="detail-link-box" href="${escapeHtml(uni.deep_links.intl_qualifications)}" target="_blank" rel="noopener noreferrer">
              <span>国际课程录取要求官网</span><span>↗</span>
            </a>
            <a class="detail-link-box" href="${escapeHtml(uni.deep_links.gaokao_channel)}" target="_blank" rel="noopener noreferrer">
              <span>中国高考生要求官网</span><span>↗</span>
            </a>
            <a class="detail-link-box" href="${escapeHtml(uni.deep_links.english_proficiency)}" target="_blank" rel="noopener noreferrer">
              <span>语言成绩与豁免政策官网</span><span>↗</span>
            </a>
            <a class="detail-link-box" href="${escapeHtml(uni.deep_links.deadlines_and_fees)}" target="_blank" rel="noopener noreferrer">
              <span>申请截止日期与费用官网</span><span>↗</span>
            </a>
          </div>
        </div>

        <div class="detail-block">
          <div class="detail-block-title">${TRACK_META[state.activeTrack].label} 申请条件详情与语言政策</div>
          <div class="card-req-line ${activeTrackInfo.accepted ? '' : 'not-accepted'}" style="font-size:0.95rem;font-weight:800;">
            ${escapeHtml(activeTrackInfo.headline)}
          </div>
          ${uni.special_channels ? `<div class="detail-special-channel-box"><strong>专项计划 / 补充通道：</strong>${escapeHtml(uni.special_channels)}</div>` : ''}
          <div class="detail-info-grid">
            <div class="detail-info-item">
              <strong>必修与选科要求</strong>
              <span>${escapeHtml(activeTrackInfo.subject_reqs || '满足所申请专业常规科目要求')}</span>
            </div>
            <div class="detail-info-item">
              <strong>标化考试与笔面试</strong>
              <span>${escapeHtml(activeTrackInfo.standardized_test || '无额外笔面试要求')}</span>
            </div>
            <div class="detail-info-item">
              <strong>英语成绩与豁免细则</strong>
              <span>
                雅思 ${escapeHtml(uni.language.ielts.overall)} (${escapeHtml(uni.language.ielts.subscore)}) /
                托福 ${escapeHtml(uni.language.toefl.overall)} /
                多邻国 ${uni.language.duolingo.accepted ? escapeHtml(uni.language.duolingo.score || '接受') : '不接受'}。
                ${escapeHtml(uni.language.waiver_policy)}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-block">
          <div class="detail-block-title">申请季关键时间轴</div>
          <div class="detail-info-grid">
            ${timelineHtml}
          </div>
        </div>

        <div class="detail-block">
          <div class="detail-block-title">五大高中课程体系要求对照表</div>
          <table class="comparison-table">
            <thead>
              <tr>
                <th>课程体系</th>
                <th>直申状态</th>
                <th>申请条件与选科说明</th>
              </tr>
            </thead>
            <tbody>
              ${allTracksRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btnBackToDirectory').addEventListener('click', () => {
      state.activeView = 'directory';
      state.detailUniId = null;
      renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btnDetailToggleShortlist').addEventListener('click', () => {
      if (state.shortlist.has(uni.id)) {
        state.shortlist.delete(uni.id);
        showToast(`已从选校日历移除：${uni.name_zh}`);
      } else {
        state.shortlist.add(uni.id);
        showToast(`已加入选校日历：${uni.name_zh}`);
      }
      saveShortlist();
      renderAll();
    });
  }

  function analyzeShortlistConflicts(selectedUnis) {
    const alerts = [];
    const regions = new Set(selectedUnis.map(u => u.region));
    const ids = new Set(selectedUnis.map(u => u.id));

    if (selectedUnis.length === 0) {
      alerts.push('当前选校日历为空，请在院校条件库中点击「+ 日历」。');
      return alerts;
    }

    const unaccepted = selectedUnis.filter(u => !u.tracks[state.activeTrack]?.accepted);
    if (unaccepted.length > 0) {
      alerts.push(`直申通道提示：当前为${TRACK_META[state.activeTrack].short}体系，${unaccepted.map(u => u.name_zh).join('、')}不接受直接入读大一，需通过预科或转轨国际课程。`);
    }
    if (regions.has('HK') && (regions.has('US') || regions.has('UK'))) {
      alerts.push('留位费时间差提示：香港高校首轮在12月至次年1月放榜后需在2-3周内缴纳留位费，早于3-4月美本常规轮与部分英国名校放榜。');
    }
    const ukUnis = selectedUnis.filter(u => u.region === 'UK');
    if (ukUnis.length > 0) {
      alerts.push(`英国志愿提示：已选 ${ukUnis.length} 所英国大学，UCAS 限填 5 个志愿且共用同一篇个人陈述，专业方向需保持一致。`);
    }
    if (ids.has('oxford') && ids.has('cambridge')) {
      alerts.push('牛剑互斥提示：同一申请季牛津大学与剑桥大学只能二选一填报。');
    }
    if (regions.has('SG') && state.activeTrack === 'gaokao') {
      alerts.push('新加坡高考生提示：新国立与南洋理工在高考前（1-2月）即截止报名，且报名时须具备雅思或托福成绩。');
    }
    if (alerts.length === 0) {
      alerts.push('当前所选院校的时间线分布均衡，无明显硬性冲突。');
    }
    return alerts;
  }

  function renderTimelineView() {
    const selectedUnis = UNIVERSITIES.filter(u => state.shortlist.has(u.id));
    const chipsContainer = document.getElementById('shortlistChipsContainer');
    const trackPill = document.getElementById('calendarTrackPill');
    const conflictListEl = document.getElementById('conflictAlertsList');
    const monthsGridEl = document.getElementById('calendarMonthsGrid');

    if (trackPill) trackPill.textContent = TRACK_META[state.activeTrack].label;

    if (selectedUnis.length === 0) {
      chipsContainer.innerHTML = `<span style="font-size:0.84rem;font-weight:700;color:#64748B;">暂未添加学校，请点击右上角「载入示范组合」或在院校库中添加</span>`;
    } else {
      chipsContainer.innerHTML = selectedUnis.map(u => {
        const rMeta = REGION_META[u.region] || { flag: '' };
        const pastel = getSchoolPastel(u.id);
        return `
          <span
            class="shortlist-chip"
            style="background:${pastel.bg};color:${pastel.text};"
            data-action="chip-open-detail"
            data-id="${escapeHtml(u.id)}"
          >
            <span>${rMeta.flag} ${escapeHtml(u.name_zh)}</span>
            <button class="chip-remove no-print" data-action="remove-shortlist" data-id="${escapeHtml(u.id)}" title="移除" type="button">×</button>
          </span>
        `;
      }).join('');
    }

    monthsGridEl.innerHTML = SEASON_MONTHS.map(mObj => {
      const events = [];
      for (const uni of selectedUnis) {
        for (const node of (uni.timeline || [])) {
          if (node.month !== mObj.month) continue;
          const matchTrack = node.applicable_tracks === 'all' ||
            (Array.isArray(node.applicable_tracks) && node.applicable_tracks.includes(state.activeTrack));
          if (matchTrack) events.push({ uni, node });
        }
      }

      const hasEvents = events.length > 0;
      return `
        <div class="cal-month-cell ${hasEvents ? 'has-events' : ''}">
          <div class="cal-month-top">
            <div class="cal-month-title">
              <span>${mObj.num}</span>
              <span class="cal-month-en">${mObj.en}</span>
            </div>
            <span class="cal-month-phase">${escapeHtml(mObj.phase)}</span>
          </div>

          <div class="cal-month-events">
            ${
              hasEvents
                ? events.map(({ uni, node }) => {
                    const pastel = getSchoolPastel(uni.id);
                    const shortDate = extractShortDate(node.exact_date_desc, mObj.month);
                    return `
                      <div
                        class="cal-event-pill"
                        style="background:${pastel.bg};color:${pastel.text};"
                        data-action="open-detail"
                        data-id="${escapeHtml(uni.id)}"
                      >
                        <div class="cal-event-left">
                          <div class="cal-event-school-name">${escapeHtml(uni.name_zh)}</div>
                          <div class="cal-event-round-name">${escapeHtml(node.round_name)}</div>
                        </div>
                        <span class="cal-event-date-tag" style="color:${pastel.text};">${escapeHtml(shortDate)}</span>
                      </div>
                    `;
                  }).join('')
                : `<div class="cal-empty-note">无截止节点</div>`
            }
          </div>
        </div>
      `;
    }).join('');

    const alerts = analyzeShortlistConflicts(selectedUnis);
    conflictListEl.innerHTML = alerts.map(a => `<li>${escapeHtml(a)}</li>`).join('');
  }

  // ==============================================================
  // 辅助绘制：绘制带两侧/上下半圆缺口与撕裂虚线的「船票 (Ship Ticket)」外框
  // ==============================================================
  function drawHorizontalTicketBox(ctx, x, y, w, h, stubX, bgMain, bgStub, pageBg) {
    // 底部柔和立体阴影
    ctx.fillStyle = 'rgba(30, 41, 59, 0.14)';
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w, h, 18);
    ctx.fill();

    // 主票底色
    ctx.fillStyle = bgMain;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 18);
    ctx.fill();
    ctx.stroke();

    // 右侧副券底色
    ctx.fillStyle = bgStub;
    ctx.beginPath();
    ctx.roundRect(stubX, y, x + w - stubX, h, [0, 18, 18, 0]);
    ctx.fill();
    ctx.stroke();

    // 船票垂直撕裂虚线
    ctx.save();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(stubX, y + 12);
    ctx.lineTo(stubX, y + h - 12);
    ctx.stroke();
    ctx.restore();

    // 撕裂线上下两端半圆打孔缺口 + 左右票边半圆打孔缺口
    const notches = [
      { nx: stubX, ny: y, r: 9 },
      { nx: stubX, ny: y + h, r: 9 },
      { nx: x, ny: y + h / 2, r: 8 },
      { nx: x + w, ny: y + h / 2, r: 8 }
    ];
    notches.forEach(({ nx, ny, r }) => {
      ctx.fillStyle = pageBg;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  // ==============================================================
  // 1. 「分享图片」画布渲染：只分「长图」(long) 与「方图」(square)
  // 采用与网站一致的柔和淡黄色 (#FEF08A) 多巴胺色系，底部为横向船票二维码框
  // ==============================================================
  function generateCalendarImage(shape) {
    const selectedUnis = UNIVERSITIES.filter(u => state.shortlist.has(u.id));
    const displayUnis = selectedUnis.length > 0 ? selectedUnis : getFilteredUniversities().slice(0, 6);
    const shareUrl = getShareableUrl();
    const scale = 2;

    const isLong = shape === 'long';
    const width = isLong ? 760 : 1080;
    const cols = isLong ? 2 : 4;
    const rows = Math.ceil(SEASON_MONTHS.length / cols);

    const padX = isLong ? 32 : 38;
    const gap = 14;
    const cellW = (width - padX * 2 - gap * (cols - 1)) / cols;
    const cellH = isLong ? 184 : 210;

    const headerH = isLong ? 150 : 138;
    const gridH = rows * cellH + (rows - 1) * gap;
    const footerH = 112;
    const totalHeight = headerH + gridH + footerH + 34;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    const pageBg = '#FAF8F5';
    ctx.fillStyle = pageBg;
    ctx.fillRect(0, 0, width, totalHeight);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.05)';
    for (let gx = 20; gx < width; gx += 24) {
      for (let gy = 20; gy < totalHeight; gy += 24) {
        ctx.beginPath(); ctx.arc(gx, gy, 1.1, 0, Math.PI * 2); ctx.fill();
      }
    }

    // 顶部柔和淡黄色日历报头卡片（与网站一致的 #FEF08A -> #FDE68A）
    ctx.fillStyle = 'rgba(30, 41, 59, 0.14)';
    ctx.beginPath();
    ctx.roundRect(padX + 4, 24, width - padX * 2, headerH - 36, 18);
    ctx.fill();

    const hdrGrad = ctx.createLinearGradient(padX, 20, width - padX, headerH - 16);
    hdrGrad.addColorStop(0, '#FEF08A');
    hdrGrad.addColorStop(1, '#FDE68A');
    ctx.fillStyle = hdrGrad;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padX, 20, width - padX * 2, headerH - 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1E3A8A';
    ctx.font = `900 ${isLong ? 25 : 27}px -apple-system, "PingFang SC", sans-serif`;
    ctx.fillText('扬帆海本 · 2026–2027 选校申请日历', padX + 22, 62);

    // 右上角柔粉体系标签
    const trackText = TRACK_META[state.activeTrack].short + '体系';
    ctx.fillStyle = '#FECDD3';
    ctx.beginPath();
    ctx.roundRect(width - padX - 112, 36, 90, 30, 8);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#9F1239';
    ctx.font = '800 13px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(trackText, width - padX - 94, 56);

    // 已选目标校彩色小胶囊行
    let chipX = padX + 22;
    const chipY = 82;
    displayUnis.slice(0, isLong ? 5 : 8).forEach((u) => {
      const pastel = getSchoolPastel(u.id);
      const rMeta = REGION_META[u.region] || { flag: '' };
      const label = `${rMeta.flag} ${u.name_zh}`;
      ctx.font = '800 12px -apple-system, "PingFang SC", sans-serif';
      const tw = ctx.measureText(label).width + 18;
      if (chipX + tw > width - padX - 20) return;

      ctx.fillStyle = pastel.bg;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, tw, 24, 7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = pastel.text;
      ctx.fillText(label, chipX + 9, chipY + 16);
      chipX += tw + 8;
    });

    // 主体：12个月完整日历网格
    const startY = headerH + 2;
    SEASON_MONTHS.forEach((mObj, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = padX + col * (cellW + gap);
      const y = startY + row * (cellH + gap);

      const events = [];
      for (const uni of displayUnis) {
        for (const node of (uni.timeline || [])) {
          if (node.month !== mObj.month) continue;
          const matchTrack = node.applicable_tracks === 'all' ||
            (Array.isArray(node.applicable_tracks) && node.applicable_tracks.includes(state.activeTrack));
          if (matchTrack) events.push({ uni, node });
        }
      }

      ctx.fillStyle = 'rgba(30, 41, 59, 0.1)';
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, cellW, cellH, 14);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(x, y, cellW, cellH, 14);
      ctx.fill();
      ctx.stroke();

      // 月份顶栏（有节点的月份用与网站一致的淡黄色 #FEF08A）
      ctx.fillStyle = events.length > 0 ? '#FEF08A' : '#F1F5F9';
      ctx.beginPath();
      ctx.roundRect(x, y, cellW, 36, [14, 14, 0, 0]);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y + 36);
      ctx.lineTo(x + cellW, y + 36);
      ctx.stroke();

      ctx.fillStyle = '#1E3A8A';
      ctx.font = '900 14.5px -apple-system, "PingFang SC", sans-serif';
      ctx.fillText(`${mObj.num} ${mObj.en}`, x + 12, y + 24);

      ctx.fillStyle = '#475569';
      ctx.font = '700 11px -apple-system, "PingFang SC", sans-serif';
      ctx.fillText(mObj.phase, x + cellW - ctx.measureText(mObj.phase).width - 12, y + 23);

      if (events.length === 0) {
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '700 12px -apple-system, "PingFang SC", sans-serif';
        ctx.fillText('无截止节点', x + cellW / 2 - 30, y + cellH / 2 + 12);
      } else {
        let evY = y + 44;
        events.slice(0, 4).forEach(({ uni, node }) => {
          const pastel = getSchoolPastel(uni.id);
          const shortDate = extractShortDate(node.exact_date_desc, mObj.month);

          ctx.fillStyle = pastel.bg;
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(x + 8, evY, cellW - 16, 29, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = pastel.text;
          ctx.font = '800 12px -apple-system, "PingFang SC", sans-serif';
          const label = `${uni.name_zh} · ${node.round_name.slice(0, 6)}`;
          ctx.fillText(label, x + 14, evY + 19);

          ctx.font = '800 11px -apple-system, "PingFang SC", sans-serif';
          const dw = ctx.measureText(shortDate).width;
          ctx.fillText(shortDate, x + cellW - dw - 14, evY + 19);
          evY += 33;
        });
      }
    });

    // ==============================================================
    // 底部：横向柔和淡黄「船票 (Ship Ticket)」二维码框
    // ==============================================================
    const fy = startY + gridH + 16;
    const ticketW = width - padX * 2;
    const ticketH = 96;
    const stubX = padX + ticketW - 142;

    drawHorizontalTicketBox(ctx, padX, fy, ticketW, ticketH, stubX, '#FEF08A', '#A7F3D0', pageBg);

    // 左侧船票条形码装饰纹
    ctx.fillStyle = '#1E293B';
    const barPattern = [3, 2, 5, 2, 2, 4, 2, 3];
    let bx = padX + 18;
    barPattern.forEach((bw, idx) => {
      if (idx % 2 === 0) ctx.fillRect(bx, fy + 18, bw, ticketH - 36);
      bx += bw + 2;
    });

    // 船票主票面文字
    ctx.fillStyle = '#FECDD3';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(padX + 52, fy + 16, 162, 24, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#9F1239';
    ctx.font = '800 11.5px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('VOYAGE PASS · 扬帆船票', padX + 62, fy + 32);

    ctx.fillStyle = '#1E3A8A';
    ctx.font = `900 ${isLong ? 17 : 20}px -apple-system, "PingFang SC", sans-serif`;
    ctx.fillText('扬帆海本 · 100所海外名校条件速查与选校日历', padX + 52, fy + 62);

    ctx.fillStyle = '#334155';
    ctx.font = '700 12.5px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('输分 1 秒匹配目标大学官方录取要求与申请时间轴', padX + 52, fy + 82);

    // 右侧副券二维码
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(stubX + 32, fy + 10, 76, 76, 10);
    ctx.fill();
    ctx.stroke();

    if (window.QRMini) {
      window.QRMini.drawQRCodeOnCanvas(ctx, shareUrl, stubX + 36, fy + 14, 68, '#1E3A8A', '#FFFFFF');
    }

    return canvas.toDataURL('image/png');
  }

  // ==============================================================
  // 2. 「分享链接 -> 二维码」竖版柔和淡黄「船票 (Boarding Pass / Ship Ticket)」
  // 网站同款淡黄色 (#FEF08A) + 去掉底部一排 emoji + 放大文字 + 简约美观排版
  // ==============================================================
  function generateVisualQrCardDataUrl() {
    const shareUrl = getShareableUrl();
    const w = 740, h = 920, scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // 与网站一致的柔和奶油背景 + 柔和几何光斑
    const pageBg = '#FAF8F5';
    ctx.fillStyle = pageBg;
    ctx.fillRect(0, 0, w, h);

    const bgDots = [
      { x: 78, y: 92, r: 54, c: '#FEF08A' },
      { x: 662, y: 118, r: 48, c: '#A7F3D0' },
      { x: 74, y: 828, r: 46, c: '#FECDD3' },
      { x: 660, y: 816, r: 54, c: '#BAE6FD' }
    ];
    bgDots.forEach(d => {
      ctx.fillStyle = d.c;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 船票主体几何参数
    const tx = 52, ty = 40, tw = w - 104, th = h - 80;
    const tearY = 456; // 船票上下分券撕裂线位置

    // 船票柔和立体投影
    ctx.fillStyle = 'rgba(30, 41, 59, 0.14)';
    ctx.beginPath();
    ctx.roundRect(tx + 6, ty + 6, tw, th, 28);
    ctx.fill();

    // 船票外框纯白底板
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, th, 28);
    ctx.fill();
    ctx.stroke();

    // 船票顶部柔和淡黄色登船头栏 (与网站一致的 #FEF08A -> #FDE68A)
    const topGrad = ctx.createLinearGradient(tx, ty, tx + tw, ty + 88);
    topGrad.addColorStop(0, '#FEF08A');
    topGrad.addColorStop(1, '#FDE68A');
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, 88, [28, 28, 0, 0]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx, ty + 88);
    ctx.lineTo(tx + tw, ty + 88);
    ctx.stroke();

    // 左上角放大的品牌主标题（已去除最上端船票标签，简约居中）
    ctx.fillStyle = '#1E3A8A';
    ctx.font = '900 36px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('扬帆海本', tx + 30, ty + 58);

    // 右上角简约条形码与 100 校徽标
    ctx.fillStyle = '#1E293B';
    const topBars = [4, 2, 6, 2, 3, 5, 2, 4, 2, 3, 5, 2];
    let tbx = tx + tw - 134;
    topBars.forEach((bw, idx) => {
      if (idx % 2 === 0) ctx.fillRect(tbx, ty + 18, bw, 32);
      tbx += bw + 2;
    });
    ctx.fillStyle = '#475569';
    ctx.font = '800 12px ui-monospace, monospace';
    ctx.fillText('100 UNIVERSITIES', tx + tw - 134, ty + 68);

    // ==========================================
    // 上半券（主票面）：三段式简约微缩图形 + 放大版核心功能文字
    // ==========================================
    const vizY = ty + 120;

    // 图形1：左侧「条件胶囊」微缩插画（文字放大更清晰）
    ctx.fillStyle = '#FAF8F5';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tx + 26, vizY, 172, 176, 18);
    ctx.fill();
    ctx.stroke();

    const miniPills = [
      { y: vizY + 20, bg: '#FEF08A', fg: '#1E3A8A', text: '高考 / A-Level / IB' },
      { y: vizY + 70, bg: '#E9D5FF', fg: '#5B21B6', text: '650+ · A*AA · 38+' },
      { y: vizY + 120, bg: '#A7F3D0', fg: '#065F46', text: 'IELTS 6.5 / 7.0' }
    ];
    miniPills.forEach(mp => {
      ctx.fillStyle = mp.bg;
      ctx.beginPath();
      ctx.roundRect(tx + 40, mp.y, 144, 36, 10);
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = mp.fg;
      ctx.font = '800 13.5px -apple-system, "PingFang SC", sans-serif';
      ctx.fillText(mp.text, tx + 52, mp.y + 23);
    });

    // 引导箭头 1
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(tx + 206, vizY + 88);
    ctx.lineTo(tx + 228, vizY + 88);
    ctx.lineTo(tx + 220, vizY + 80);
    ctx.moveTo(tx + 228, vizY + 88);
    ctx.lineTo(tx + 220, vizY + 96);
    ctx.stroke();

    // 图形2：中间「名校微缩船票叠层」插画（去除杂乱小国旗，突出卡片结构与大号对勾）
    const miniCards = [
      { dx: tx + 242, dy: vizY + 16, rot: -0.05, title: 'G5 / 常春藤', rk: 'QS #2', hdr: '#BAE6FD' },
      { dx: tx + 236, dy: vizY + 6,  rot: 0,     title: '百所世界名校', rk: 'TOP 100', hdr: '#FEF08A' }
    ];
    miniCards.forEach(mc => {
      ctx.save();
      ctx.translate(mc.dx + 76, mc.dy + 76);
      ctx.rotate(mc.rot);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-74, -72, 148, 148, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = mc.hdr;
      ctx.beginPath();
      ctx.roundRect(-74, -72, 148, 42, [16, 16, 0, 0]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1E3A8A';
      ctx.font = '900 13px -apple-system, "PingFang SC", sans-serif';
      ctx.fillText(mc.title, -58, -46);

      ctx.fillStyle = '#FECDD3';
      ctx.beginPath();
      ctx.roundRect(12, -62, 50, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#9F1239';
      ctx.font = '800 10.5px -apple-system, sans-serif';
      ctx.fillText(mc.rk, 18, -47);

      // 示意录取进度条
      ctx.fillStyle = '#F1F5F9';
      ctx.beginPath();
      ctx.roundRect(-56, -14, 112, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#93C5FD';
      ctx.beginPath();
      ctx.roundRect(-48, -7, 74, 10, 4);
      ctx.fill();

      ctx.fillStyle = '#F1F5F9';
      ctx.beginPath();
      ctx.roundRect(-56, 20, 68, 20, 6);
      ctx.fill();

      // 柔和薄荷绿匹配圆章
      ctx.fillStyle = '#A7F3D0';
      ctx.beginPath();
      ctx.arc(38, 36, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#065F46';
      ctx.font = '900 17px sans-serif';
      ctx.fillText('✓', 31, 42);
      ctx.restore();
    });

    // 引导箭头 2
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(tx + 404, vizY + 88);
    ctx.lineTo(tx + 426, vizY + 88);
    ctx.lineTo(tx + 418, vizY + 80);
    ctx.moveTo(tx + 426, vizY + 88);
    ctx.lineTo(tx + 418, vizY + 96);
    ctx.stroke();

    // 图形3：右侧「微缩日历网格」插画
    const calX = tx + 438;
    ctx.fillStyle = '#FAF8F5';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(calX, vizY, 172, 176, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FECDD3';
    ctx.beginPath();
    ctx.roundRect(calX, vizY, 172, 38, [18, 18, 0, 0]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9F1239';
    ctx.font = '900 13px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('8月 — 次年7月日历', calX + 28, vizY + 24);

    const miniColors = ['#FEF08A', '#BAE6FD', '#A7F3D0', '#FECDD3', '#E9D5FF', '#FEF08A', '#E2E8F0', '#A7F3D0', '#FECDD3'];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        const bx = calX + 14 + c * 50;
        const by = vizY + 50 + r * 38;
        ctx.fillStyle = miniColors[idx];
        ctx.beginPath();
        ctx.roundRect(bx, by, 44, 30, 6);
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }

    // 放大后的核心功能文字信息（柔和薄荷绿通栏胶囊）
    ctx.fillStyle = '#A7F3D0';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tx + 26, vizY + 196, tw - 52, 52, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#065F46';
    ctx.font = '900 20px -apple-system, "PingFang SC", sans-serif';
    const funcLine = '输分 1 秒匹配 100 所海外名校录取条件与选校日历';
    const flw = ctx.measureText(funcLine).width;
    ctx.fillText(funcLine, tx + (tw - flw) / 2, vizY + 229);

    // ==========================================
    // 船票中部撕裂虚线 + 左右两侧半圆打孔凹槽
    // ==========================================
    ctx.save();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(tx + 26, tearY);
    ctx.lineTo(tx + tw - 26, tearY);
    ctx.stroke();
    ctx.restore();

    [tx, tx + tw].forEach(nx => {
      ctx.fillStyle = pageBg;
      ctx.beginPath();
      ctx.arc(nx, tearY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(nx, tearY, 20, 0, Math.PI * 2);
      ctx.stroke();
    });

    // ==========================================
    // 下半券（副券）：简约柔和淡黄二维码画框（无底部 emoji，视觉干净大方）
    // ==========================================
    const qrBoxW = 356, qrBoxH = 356;
    const qrBoxX = (w - qrBoxW) / 2;
    const qrBoxY = tearY + 34;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.1)';
    ctx.beginPath();
    ctx.roundRect(qrBoxX + 5, qrBoxY + 5, qrBoxW, qrBoxH, 24);
    ctx.fill();

    ctx.fillStyle = '#FEF08A';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrBoxX + 24, qrBoxY + 24, qrBoxW - 48, qrBoxH - 48, 16);
    ctx.fill();
    ctx.stroke();

    if (window.QRMini) {
      window.QRMini.drawQRCodeOnCanvas(ctx, shareUrl, qrBoxX + 40, qrBoxY + 40, qrBoxW - 80, '#1E3A8A', '#FFFFFF');
    }

    return canvas.toDataURL('image/png');
  }

  // ==============================================================
  // 弹窗 1：「分享图片」（只提供「长图」与「方图」两个选项，默认打开长图）
  // ==============================================================
  function renderShareImageModal() {
    document.getElementById('modalTitle').textContent = '分享图片';
    const bodyEl = document.getElementById('modalBody');
    const dataUrl = generateCalendarImage(state.imageShape);
    const isLong = state.imageShape === 'long';

    bodyEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap;">
        <div style="display:inline-flex;gap:8px;">
          <button id="btnShapeLong" class="pill-btn ${isLong ? 'active' : ''}" type="button">长图</button>
          <button id="btnShapeSquare" class="pill-btn ${!isLong ? 'active' : ''}" type="button">方图</button>
        </div>

        <a href="${dataUrl}" download="扬帆海本-选校日历-${isLong ? '长图' : '方图'}.png" class="btn btn-poster">
          下载图片
        </a>
      </div>

      <div style="border:2px solid #1E293B;border-radius:14px;background:#F1F5F9;max-height:72vh;overflow-y:auto;text-align:center;padding:14px;">
        <img src="${dataUrl}" alt="选校日历图片" style="max-width:${isLong ? '420px' : '540px'};width:100%;height:auto;border-radius:10px;box-shadow:0 6px 20px rgba(15,23,42,0.12);" />
      </div>
    `;

    document.getElementById('btnShapeLong').addEventListener('click', () => {
      state.imageShape = 'long';
      renderShareImageModal();
    });
    document.getElementById('btnShapeSquare').addEventListener('click', () => {
      state.imageShape = 'square';
      renderShareImageModal();
    });
  }

  function openShareImageModal() {
    state.imageShape = 'long';
    renderShareImageModal();
    document.getElementById('detailModalBackdrop').classList.remove('hidden');
  }

  // ==============================================================
  // 弹窗 2：「分享链接」（只提供「网址」与「二维码」两个选项，网址最前面带一句文字介绍）
  // ==============================================================
  function renderShareLinkModal() {
    document.getElementById('modalTitle').textContent = '分享链接';
    const bodyEl = document.getElementById('modalBody');
    const shareUrl = getShareableUrl();
    const introAndUrl = `扬帆海本｜输入高考/A-Level/IB/AP/OSSD分数，1秒匹配100所海外名校官方录取条件与选校日历：${shareUrl}`;
    const isUrl = state.shareLinkTab === 'url';

    if (isUrl) {
      bodyEl.innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <button id="btnTabUrl" class="pill-btn active" type="button">网址</button>
          <button id="btnTabQr" class="pill-btn" type="button">二维码</button>
        </div>

        <div style="background:#FFFFFF;border:2px solid #1E293B;border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px;">
          <textarea
            id="shareUrlInputBox"
            readonly
            rows="3"
            style="width:100%;border:1.5px solid #CBD5E1;border-radius:8px;padding:10px 12px;font-size:13px;font-weight:700;color:#1E293B;background:#F8FAFC;outline:none;resize:none;line-height:1.5;"
          >${escapeHtml(introAndUrl)}</textarea>
          <div style="display:flex;justify-content:flex-end;">
            <button id="btnDoCopyUrl" class="btn btn-share-link" type="button">复制链接</button>
          </div>
        </div>
      `;

      document.getElementById('btnDoCopyUrl').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(introAndUrl);
          showToast('已复制介绍与链接');
        } catch (_) {
          document.getElementById('shareUrlInputBox').select();
          showToast('请长按或按 Ctrl+C 复制');
        }
      });
    } else {
      const qrCardUrl = generateVisualQrCardDataUrl();
      bodyEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;">
          <div style="display:inline-flex;gap:8px;">
            <button id="btnTabUrl" class="pill-btn" type="button">网址</button>
            <button id="btnTabQr" class="pill-btn active" type="button">二维码</button>
          </div>

          <a href="${qrCardUrl}" download="扬帆海本-船票二维码.png" class="btn btn-share-link">下载船票二维码</a>
        </div>

        <div style="border:2px solid #1E293B;border-radius:14px;background:#F1F5F9;max-height:70vh;overflow-y:auto;text-align:center;padding:14px;">
          <img src="${qrCardUrl}" alt="扬帆海本船票二维码" style="max-width:400px;width:100%;height:auto;border-radius:12px;box-shadow:0 6px 20px rgba(15,23,42,0.12);" />
        </div>
      `;
    }

    document.getElementById('btnTabUrl').addEventListener('click', () => {
      state.shareLinkTab = 'url';
      renderShareLinkModal();
    });
    document.getElementById('btnTabQr').addEventListener('click', () => {
      state.shareLinkTab = 'qr';
      renderShareLinkModal();
    });
  }

  function openShareLinkModal() {
    state.shareLinkTab = 'qr'; // 默认展示精美的图形化二维码卡，也可一键切到网址
    renderShareLinkModal();
    document.getElementById('detailModalBackdrop').classList.remove('hidden');
  }

  function syncControlUI() {
    document.querySelectorAll('#trackPillsContainer .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.track === state.activeTrack);
    });
    renderScoreFilterRow();
    document.querySelectorAll('#regionPillsContainer .pill-btn').forEach(btn => {
      btn.classList.toggle('active', state.selectedRegions.has(btn.dataset.region));
    });
    document.querySelectorAll('#langPillsContainer .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === state.langFilter);
    });

    document.getElementById('shortlistCountBadge').textContent = state.shortlist.size;

    const v = state.activeView;
    document.getElementById('globalFilterConsole').classList.toggle('hidden', v === 'detail');
    document.getElementById('directoryViewSection').classList.toggle('hidden', v !== 'directory');
    document.getElementById('detailViewSection').classList.toggle('hidden', v !== 'detail');
    document.getElementById('timelineViewSection').classList.toggle('hidden', v !== 'timeline');

    document.getElementById('navBtnDirectory').classList.toggle('active', v === 'directory' || v === 'detail');
    document.getElementById('navBtnCalendar').classList.toggle('active', v === 'timeline');
  }

  function renderAll() {
    syncControlUI();
    if (state.activeView === 'directory') renderDirectory();
    else if (state.activeView === 'detail') renderDetailPage();
    else if (state.activeView === 'timeline') renderTimelineView();
  }

  function bindEvents() {
    document.getElementById('brandHomeTrigger').addEventListener('click', () => {
      state.activeView = 'directory';
      state.detailUniId = null;
      renderAll();
    });

    document.getElementById('navBtnDirectory').addEventListener('click', () => {
      state.activeView = 'directory';
      state.detailUniId = null;
      renderAll();
    });

    document.getElementById('navBtnCalendar').addEventListener('click', () => {
      state.activeView = 'timeline';
      renderAll();
    });

    document.getElementById('btnClearFilters').addEventListener('click', () => {
      state.activeTrack = 'gaokao';
      state.scoreFilter = 'ALL';
      state.selectedRegions = new Set(['ALL']);
      state.langFilter = 'ALL';
      state.searchQuery = '';
      state.acceptedOnly = false;
      document.getElementById('searchInput').value = '';
      document.getElementById('chkAcceptedOnly').checked = false;
      saveTrack();
      renderAll();
      showToast('已重置筛选条件');
    });

    document.getElementById('trackPillsContainer').addEventListener('click', e => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      state.activeTrack = btn.dataset.track;
      state.scoreFilter = 'ALL';
      saveTrack();
      renderAll();
    });

    document.getElementById('scorePillsContainer').addEventListener('click', e => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      state.scoreFilter = btn.dataset.score;
      if (state.activeView !== 'directory') state.activeView = 'directory';
      renderAll();
    });

    document.getElementById('regionPillsContainer').addEventListener('click', e => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      const reg = btn.dataset.region;
      if (reg === 'ALL') {
        state.selectedRegions = new Set(['ALL']);
      } else {
        state.selectedRegions.delete('ALL');
        if (state.selectedRegions.has(reg)) {
          state.selectedRegions.delete(reg);
          if (state.selectedRegions.size === 0) state.selectedRegions.add('ALL');
        } else {
          state.selectedRegions.add(reg);
        }
      }
      if (state.activeView !== 'directory') state.activeView = 'directory';
      renderAll();
    });

    document.getElementById('langPillsContainer').addEventListener('click', e => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      state.langFilter = btn.dataset.lang;
      if (state.activeView !== 'directory') state.activeView = 'directory';
      renderAll();
    });

    document.getElementById('searchInput').addEventListener('input', e => {
      state.searchQuery = e.target.value;
      if (state.activeView !== 'directory') state.activeView = 'directory';
      renderDirectory();
    });

    document.getElementById('chkAcceptedOnly').addEventListener('change', e => {
      state.acceptedOnly = e.target.checked;
      renderDirectory();
    });

    document.getElementById('uniCardsGrid').addEventListener('click', e => {
      if (e.target.closest('[data-action="stop-prop"]')) return;
      const toggleBtn = e.target.closest('[data-action="toggle-shortlist"]');
      if (toggleBtn) {
        e.stopPropagation();
        const id = toggleBtn.dataset.id;
        const uni = UNIVERSITIES.find(u => u.id === id);
        if (state.shortlist.has(id)) {
          state.shortlist.delete(id);
          showToast(`已移除：${uni ? uni.name_zh : id}`);
        } else {
          state.shortlist.add(id);
          showToast(`已加入选校日历：${uni ? uni.name_zh : id}`);
        }
        saveShortlist();
        renderAll();
        return;
      }
      const cardEl = e.target.closest('[data-action="open-detail"]');
      if (cardEl) {
        state.detailUniId = cardEl.dataset.id;
        state.activeView = 'detail';
        renderAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    document.getElementById('timelineViewSection').addEventListener('click', e => {
      const removeBtn = e.target.closest('[data-action="remove-shortlist"]');
      if (removeBtn) {
        e.stopPropagation();
        state.shortlist.delete(removeBtn.dataset.id);
        saveShortlist();
        renderAll();
        return;
      }
      const openEl = e.target.closest('[data-action="open-detail"], [data-action="chip-open-detail"]');
      if (openEl) {
        state.detailUniId = openEl.dataset.id;
        state.activeView = 'detail';
        renderAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    document.getElementById('btnLoadSamplePreset').addEventListener('click', () => {
      state.shortlist = new Set(['hku', 'nus', 'ucl', 'cornell', 'uoft', 'usyd']);
      saveShortlist();
      renderAll();
      showToast('已载入示范组合');
    });

    document.getElementById('btnClearShortlist').addEventListener('click', () => {
      state.shortlist.clear();
      saveShortlist();
      renderAll();
      showToast('已清空选校日历');
    });

    document.getElementById('btnShareImageTop').addEventListener('click', openShareImageModal);
    document.getElementById('btnShareImageMain').addEventListener('click', openShareImageModal);
    document.getElementById('btnShareLinkTop').addEventListener('click', openShareLinkModal);

    document.getElementById('btnCloseModal').addEventListener('click', () => {
      document.getElementById('detailModalBackdrop').classList.add('hidden');
    });
    document.getElementById('detailModalBackdrop').addEventListener('click', e => {
      if (e.target.id === 'detailModalBackdrop') {
        e.target.classList.add('hidden');
      }
    });
  }

  initState();
  bindEvents();
  renderAll();
})();
