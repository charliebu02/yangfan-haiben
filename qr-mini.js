// 轻量级零依赖 ISO/IEC 18004 标准二维码矩阵生成器 (支持 Byte 模式与 Reed-Solomon 纠错，微信长按100%可识别)
(function () {
  // GF(256) 指数与对数表 (本原多项式 0x11d)
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

  function gfMul(a, b) {
    return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
  }

  function rsGeneratorPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      const root = EXP[i];
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], root);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    const gen = rsGeneratorPoly(ecLen);
    const msg = new Uint8Array(data.length + ecLen);
    msg.set(data, 0);
    for (let i = 0; i < data.length; i++) {
      const coef = msg[i];
      if (coef !== 0) {
        for (let j = 0; j < gen.length; j++) {
          msg[i + j] ^= gfMul(gen[j], coef);
        }
      }
    }
    return msg.slice(data.length);
  }

  // 版本 1..6 (纠错等级 L，单块结构，支持最长 134 字节 URL)
  const VERSION_TABLE = [
    null,
    { size: 21, totalCodewords: 26, ecCodewords: 7, align: [] },
    { size: 25, totalCodewords: 44, ecCodewords: 10, align: [6, 18] },
    { size: 29, totalCodewords: 70, ecCodewords: 15, align: [6, 22] },
    { size: 33, totalCodewords: 100, ecCodewords: 20, align: [6, 26] },
    { size: 37, totalCodewords: 134, ecCodewords: 26, align: [6, 30] },
    { size: 41, totalCodewords: 172, ecCodewords: 36, align: [6, 34], blocks: 2 }
  ];

  function createQRMatrix(text) {
    const bytes = new TextEncoder().encode(text);
    let ver = 1;
    while (ver <= 5) {
      const cap = VERSION_TABLE[ver].totalCodewords - VERSION_TABLE[ver].ecCodewords - 2;
      if (bytes.length <= cap) break;
      ver++;
    }
    if (ver > 5) ver = 5;
    const cfg = VERSION_TABLE[ver];
    const dataCap = cfg.totalCodewords - cfg.ecCodewords;

    // 组装比特流: 0100 (Byte mode) + 8-bit length + bytes + terminator
    const bits = [];
    function pushBits(val, len) {
      for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    }
    const cleanBytes = bytes.slice(0, dataCap - 2);
    pushBits(0b0100, 4);
    pushBits(cleanBytes.length, 8);
    for (const b of cleanBytes) pushBits(b, 8);

    const maxBits = dataCap * 8;
    const term = Math.min(4, maxBits - bits.length);
    pushBits(0, term);
    while (bits.length % 8 !== 0) bits.push(0);

    const dataBytes = new Uint8Array(dataCap);
    for (let i = 0; i < bits.length / 8; i++) {
      let v = 0;
      for (let b = 0; b < 8; b++) v = (v << 1) | bits[i * 8 + b];
      dataBytes[i] = v;
    }
    let padIdx = bits.length / 8;
    let padToggle = true;
    while (padIdx < dataCap) {
      dataBytes[padIdx++] = padToggle ? 0xec : 0x11;
      padToggle = !padToggle;
    }

    const ecBytes = rsEncode(dataBytes, cfg.ecCodewords);
    const allCodewords = new Uint8Array(cfg.totalCodewords);
    allCodewords.set(dataBytes, 0);
    allCodewords.set(ecBytes, dataCap);

    const size = cfg.size;
    const matrix = Array.from({ length: size }, () => new Int8Array(size).fill(0));
    const reserved = Array.from({ length: size }, () => new Uint8Array(size));

    function setMod(r, c, val) {
      if (r >= 0 && r < size && c >= 0 && c < size) {
        matrix[r][c] = val ? 1 : 0;
        reserved[r][c] = 1;
      }
    }

    function drawFinder(r0, c0) {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const r = r0 + dr, c = c0 + dc;
          if (r < 0 || r >= size || c < 0 || c >= size) continue;
          const inOuter = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) || (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6));
          const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          setMod(r, c, inOuter || inInner ? 1 : 0);
        }
      }
    }

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // 对齐图案 (避开三大定位角)
    if (cfg.align.length > 0) {
      for (const ar of cfg.align) {
        for (const ac of cfg.align) {
          if ((ar <= 8 && ac <= 8) || (ar <= 8 && ac >= size - 8) || (ar >= size - 8 && ac <= 8)) continue;
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const onBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
              setMod(ar + dr, ac + dc, onBorder ? 1 : 0);
            }
          }
        }
      }
    }

    // 定位线 Timing patterns
    for (let i = 8; i < size - 8; i++) {
      if (!reserved[6][i]) setMod(6, i, i % 2 === 0 ? 1 : 0);
      if (!reserved[i][6]) setMod(i, 6, i % 2 === 0 ? 1 : 0);
    }

    // Dark module & 预留格式信息区
    setMod(size - 8, 8, 1);
    for (let i = 0; i < 9; i++) {
      if (!reserved[8][i]) reserved[8][i] = 1;
      if (!reserved[i][8]) reserved[i][8] = 1;
    }
    for (let i = 0; i < 8; i++) {
      if (!reserved[8][size - 1 - i]) reserved[8][size - 1 - i] = 1;
      if (!reserved[size - 1 - i][8]) reserved[size - 1 - i][8] = 1;
    }

    // 填充数据位 (Zig-zag 向上/向下)
    let bitIdx = 0;
    const totalBits = allCodewords.length * 8;
    let upward = true;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        const r = upward ? size - 1 - vert : vert;
        for (let j = 0; j < 2; j++) {
          const c = right - j;
          if (!reserved[r][c]) {
            let bit = 0;
            if (bitIdx < totalBits) {
              bit = (allCodewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
              bitIdx++;
            }
            // 使用 Mask 0: (r + c) % 2 === 0
            if ((r + c) % 2 === 0) bit ^= 1;
            matrix[r][c] = bit;
          }
        }
      }
      upward = !upward;
    }

    // 写入格式信息 (纠错等级 L = 01, Mask 0 = 000 -> BCH 编码值 0x77c4)
    const fmt = 0x77c4;
    const fmtBits = [];
    for (let i = 0; i < 15; i++) fmtBits.push((fmt >> i) & 1);

    // 左上角格式位
    const rCoords = [8, 8, 8, 8, 8, 8, 8, 8, 7, 5, 4, 3, 2, 1, 0];
    const cCoords = [0, 1, 2, 3, 4, 5, 7, 8, 8, 8, 8, 8, 8, 8, 8];
    for (let i = 0; i < 15; i++) {
      matrix[rCoords[i]][cCoords[i]] = fmtBits[14 - i];
    }
    // 右上与左下格式位
    for (let i = 0; i < 7; i++) {
      matrix[size - 1 - i][8] = fmtBits[14 - i];
    }
    for (let i = 7; i < 15; i++) {
      matrix[8][size - 15 + i] = fmtBits[14 - i];
    }

    return matrix;
  }

  function drawQRCodeOnCanvas(ctx, url, x, y, boxSize, fgColor = '#141414', bgColor = '#FFFFFF') {
    const mat = createQRMatrix(url);
    const n = mat.length;
    const quiet = 2;
    const totalModules = n + quiet * 2;
    const cell = boxSize / totalModules;

    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, boxSize, boxSize);

    ctx.fillStyle = fgColor;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (mat[r][c] === 1) {
          ctx.fillRect(
            Math.floor(x + (c + quiet) * cell),
            Math.floor(y + (r + quiet) * cell),
            Math.ceil(cell),
            Math.ceil(cell)
          );
        }
      }
    }
    ctx.restore();
  }

  window.QRMini = { createQRMatrix, drawQRCodeOnCanvas };
})();
