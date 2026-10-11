/* Tiny self-contained QR code generator (byte mode, error-correction level M, versions 1-6). No external dependencies.
   ebpQrSvg(text, pixelSize) -> '<svg …>' string, or '' when the text is too long. */
(function () {
    // version -> [dataCodewordsPerBlock, eccCodewordsPerBlock, blocks, alignment centres]
    var V = { 1: [16, 10, 1, []], 2: [28, 16, 1, [6, 18]], 3: [44, 26, 1, [6, 22]], 4: [32, 18, 2, [6, 26]], 5: [43, 24, 2, [6, 30]], 6: [27, 16, 4, [6, 34]] };
    var EXP = [], LOG = [];
    (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
    function mul(a, b) { return (a && b) ? EXP[LOG[a] + LOG[b]] : 0; }
    function rsGen(n) { var g = [1]; for (var i = 0; i < n; i++) { var ng = new Array(g.length + 1).fill(0); for (var j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
    function rsEcc(data, n) { var g = rsGen(n), r = new Array(n).fill(0); data.forEach(function (d) { var f = d ^ r.shift(); r.push(0); for (var i = 0; i < n; i++) r[i] ^= mul(g[i + 1], f); }); return r; }

    function encode(text) {
        var bytes = unescape(encodeURIComponent(text)).split('').map(function (c) { return c.charCodeAt(0); });
        var ver = 0;
        for (var v = 1; v <= 6; v++) { if (bytes.length + 2 <= V[v][0] * V[v][2]) { ver = v; break; } }
        if (!ver) return null;
        var P = V[ver], cap = P[0] * P[2], bits = [];
        function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
        put(4, 4); put(bytes.length, 8); bytes.forEach(function (b) { put(b, 8); });
        for (var t = 0; t < 4 && bits.length < cap * 8; t++) bits.push(0);
        while (bits.length % 8) bits.push(0);
        var data = []; for (var i = 0; i < bits.length; i += 8) { var n = 0; for (var k = 0; k < 8; k++) n = (n << 1) | bits[i + k]; data.push(n); }
        for (var pad = 0xEC; data.length < cap; pad = pad === 0xEC ? 0x11 : 0xEC) data.push(pad);
        var blocks = [], eccs = [];
        for (var b = 0; b < P[2]; b++) { var d = data.slice(b * P[0], (b + 1) * P[0]); blocks.push(d); eccs.push(rsEcc(d, P[1])); }
        var out = [];
        for (i = 0; i < P[0]; i++) blocks.forEach(function (d) { out.push(d[i]); });
        for (i = 0; i < P[1]; i++) eccs.forEach(function (e) { out.push(e[i]); });
        return { ver: ver, words: out, align: P[3] };
    }

    function build(text) {
        var enc = encode(text); if (!enc) return null;
        var size = 17 + 4 * enc.ver, mod = [], fn = [];
        for (var y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
        function setF(x, y, d) { if (x < 0 || y < 0 || x >= size || y >= size) return; mod[y][x] = !!d; fn[y][x] = true; }
        for (var i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
        function finder(cx, cy) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var d = Math.max(Math.abs(dx), Math.abs(dy)); setF(cx + dx, cy + dy, d !== 2 && d !== 4); } }
        finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
        var al = enc.align;
        al.forEach(function (ax, i) { al.forEach(function (ay, j) {
            if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
            for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) setF(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }); });
        function format(mask) {
            var data = (0 << 3) | mask, rem = data; // level M = 0
            for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
            var bits = ((data << 10) | rem) ^ 0x5412;
            function bit(i) { return ((bits >>> i) & 1) !== 0; }
            for (i = 0; i <= 5; i++) setF(8, i, bit(i));
            setF(8, 7, bit(6)); setF(8, 8, bit(7)); setF(7, 8, bit(8));
            for (i = 9; i < 15; i++) setF(14 - i, 8, bit(i));
            for (i = 0; i < 8; i++) setF(size - 1 - i, 8, bit(i));
            for (i = 8; i < 15; i++) setF(8, size - 15 + i, bit(i));
            setF(8, size - 8, true);
        }
        format(0);
        // place codewords
        var idx = 0, total = enc.words.length * 8;
        for (var right = size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;
            for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
                var x = right - j, up = ((right + 1) & 2) === 0, yy = up ? size - 1 - vert : vert;
                if (!fn[yy][x] && idx < total) { mod[yy][x] = ((enc.words[idx >>> 3] >>> (7 - (idx & 7))) & 1) !== 0; idx++; }
            }
        }
        var MASKS = [
            function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; }, function (x, y) { return x % 3 === 0; },
            function (x, y) { return (x + y) % 3 === 0; }, function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
            function (x, y) { return x * y % 2 + x * y % 3 === 0; }, function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; },
            function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }
        ];
        function penalty(m) {
            var p = 0, x, y, run, i;
            function line(get) { run = 1; for (i = 1; i < size; i++) { if (get(i) === get(i - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
            for (y = 0; y < size; y++) line(function (i) { return m[y][i]; });
            for (x = 0; x < size; x++) line(function (i) { return m[i][x]; });
            for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
            var pat = [true, false, true, true, true, false, true, false, false, false, false];
            function match(get, s) { var a = true, b = true; for (var k = 0; k < 11; k++) { if (get(s + k) !== pat[k]) a = false; if (get(s + k) !== pat[10 - k]) b = false; } return a || b; }
            for (y = 0; y < size; y++) for (x = 0; x <= size - 11; x++) { if (match(function (k) { return m[y][k]; }, x)) p += 40; }
            for (x = 0; x < size; x++) for (y = 0; y <= size - 11; y++) { if (match(function (k) { return m[k][x]; }, y)) p += 40; }
            var dark = 0; for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
            p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
            return p;
        }
        var best = null, bestP = 1e9, bestM = 0;
        for (var mk = 0; mk < 8; mk++) {
            var m2 = mod.map(function (r) { return r.slice(); });
            for (var y2 = 0; y2 < size; y2++) for (var x2 = 0; x2 < size; x2++) if (!fn[y2][x2] && MASKS[mk](x2, y2)) m2[y2][x2] = !m2[y2][x2];
            var pn = penalty(m2); if (pn < bestP) { bestP = pn; best = m2; bestM = mk; }
        }
        mod = best; format(bestM);
        return mod;
    }

    window.ebpQrMatrix = build;
    window.ebpQrSvg = function (text, px) {
        var m = build(text); if (!m) return '';
        var n = m.length, q = 4, d = '';
        for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (m[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
        var t = n + q * 2;
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t + ' ' + t + '" width="' + (px || 200) + '" height="' + (px || 200) + '" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="' + t + '" height="' + t + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
    };
})();
