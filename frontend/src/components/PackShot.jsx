// Product image: the uploaded pack photo when there is one, otherwise a clean illustrated pack
// (bottle, gel syringe, jerrycan, sachet, tub or box) printed with brand, name, pack size and MRP.
// The illustration is generic artwork, not a manufacturer's label.
const BRAND_TONES = {
  Envu: ['#0B6E4F', '#E8F5EF'],
  Syngenta: ['#0D5C9E', '#E7F0FA'],
  Heranba: ['#B42318', '#FDECEA'],
  Arbuda: ['#C2560C', '#FDF1E7'],
};
const toneFor = (brand) => BRAND_TONES[brand] || ['#3A3A3C', '#F2F2F5'];

const wrap = (text, max) => {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let cur = '';
  words.forEach((w) => {
    if ((`${cur} ${w}`).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = `${cur} ${w}`.trim();
  });
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
};

const Label = ({ x, y, w, h, p, tone, small }) => {
  const name = wrap(p.name, small ? 10 : 13);
  const fs = small ? 16 : 18;
  const mrpText = p.mrp != null ? `MRP ₹${Number(p.mrp).toLocaleString('en-IN')}` : 'MRP on pack';
  // Pack size and MRP sit side by side when they fit; otherwise one above the other.
  const stack = small || (String(p.pack_size || '').length + mrpText.length) * 7.6 > w - 28;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="10" fill="#fff" />
      <rect x={x} y={y} width={w} height={small ? 24 : 30} rx="10" fill={tone[0]} />
      <rect x={x} y={y + (small ? 14 : 20)} width={w} height="10" fill={tone[0]} />
      <text x={x + w / 2} y={y + (small ? 17 : 21)} textAnchor="middle" fontSize={small ? 11 : 13} fontWeight="700" fill="#fff" letterSpacing="2">{String(p.brand || '').toUpperCase()}</text>
      {name.map((line, i) => (
        <text key={line} x={x + w / 2} y={y + (small ? 46 : 60) + i * (fs + 3)} textAnchor="middle" fontSize={fs} fontWeight="800" fill="#1D1D1F">{line}</text>
      ))}
      {p.technical && <text x={x + w / 2} y={y + h - (small ? 58 : 52)} textAnchor="middle" fontSize={small ? 9.5 : 10.5} fill="#515154" {...(String(p.technical).length > (small ? 20 : 26) ? { textLength: w - 16, lengthAdjust: 'spacingAndGlyphs' } : {})}>{String(p.technical).slice(0, 34)}</text>}
      <line x1={x + 10} x2={x + w - 10} y1={y + h - (small ? 48 : 38)} y2={y + h - (small ? 48 : 38)} stroke="#E5E5EA" />
      <text x={stack ? x + w / 2 : x + 12} y={y + h - (small ? 30 : stack ? 22 : 16)} textAnchor={stack ? 'middle' : 'start'} fontSize={small ? 12 : 13} fontWeight="700" fill="#1D1D1F">{p.pack_size}</text>
      <text x={stack ? x + w / 2 : x + w - 12} y={y + h - (small ? 12 : stack ? 6 : 16)} textAnchor={stack ? 'middle' : 'end'} fontSize={small ? 11 : 12.5} fontWeight="800" fill={tone[0]}>
        {mrpText}
      </text>
    </g>
  );
};

const Shapes = {
  bottle: (p, t) => (
    <g>
      <rect x="168" y="38" width="64" height="34" rx="6" fill={t[0]} />
      <rect x="176" y="70" width="48" height="16" fill={t[0]} opacity="0.75" />
      <path d="M128 112 Q128 86 162 86 L238 86 Q272 86 272 112 L272 360 Q272 372 260 372 L140 372 Q128 372 128 360 Z" fill={t[1]} stroke={t[0]} strokeWidth="3" />
      <rect x="138" y="96" width="14" height="260" rx="7" fill="#fff" opacity="0.55" />
      <Label x={142} y={150} w={116} h={200} p={p} tone={t} small />
    </g>
  ),
  jerrycan: (p, t) => (
    <g>
      <rect x="226" y="48" width="44" height="30" rx="6" fill={t[0]} />
      <path d="M100 110 Q100 84 126 84 L210 84 L210 66 Q210 52 224 52 L232 52 L232 84 L282 84 Q300 84 300 104 L300 364 Q300 376 288 376 L112 376 Q100 376 100 364 Z" fill={t[1]} stroke={t[0]} strokeWidth="3" />
      <rect x="122" y="66" width="70" height="20" rx="10" fill="none" stroke={t[0]} strokeWidth="6" />
      <Label x={124} y={134} w={152} h={216} p={p} tone={t} />
    </g>
  ),
  gel: (p, t) => (
    <g transform="rotate(-24 200 210)">
      <rect x="182" y="20" width="36" height="34" rx="4" fill={t[0]} />
      <rect x="194" y="2" width="12" height="22" rx="4" fill={t[0]} />
      <rect x="150" y="54" width="100" height="300" rx="14" fill={t[1]} stroke={t[0]} strokeWidth="3" />
      <rect x="138" y="350" width="124" height="18" rx="6" fill={t[0]} />
      <rect x="188" y="366" width="24" height="40" fill={t[0]} opacity="0.8" />
      <Label x={158} y={86} w={84} h={240} p={{ ...p, technical: '' }} tone={t} small />
    </g>
  ),
  sachet: (p, t) => (
    <g>
      <path d="M110 70 L290 70 L296 90 L290 110 L296 130 L290 150 L296 170 L290 190 L296 210 L290 230 L296 250 L290 270 L296 290 L290 310 L296 330 L290 350 L110 350 L104 330 L110 310 L104 290 L110 270 L104 250 L110 230 L104 210 L110 190 L104 170 L110 150 L104 130 L110 110 L104 90 Z" fill={t[1]} stroke={t[0]} strokeWidth="3" />
      <rect x="110" y="70" width="180" height="22" fill={t[0]} />
      <Label x={128} y={112} w={144} h={220} p={p} tone={t} />
    </g>
  ),
  tub: (p, t) => (
    <g>
      <rect x="112" y="92" width="176" height="28" rx="8" fill={t[0]} />
      <path d="M120 120 L280 120 L268 360 Q267 372 255 372 L145 372 Q133 372 132 360 Z" fill={t[1]} stroke={t[0]} strokeWidth="3" />
      <Label x={142} y={146} w={116} h={200} p={p} tone={t} small />
    </g>
  ),
  box: (p, t) => (
    <g>
      <path d="M110 110 L250 80 L300 104 L160 134 Z" fill={t[0]} opacity="0.85" />
      <path d="M250 80 L300 104 L300 340 L250 316 Z" fill={t[0]} opacity="0.6" />
      <rect x="110" y="110" width="140" height="250" fill={t[1]} stroke={t[0]} strokeWidth="3" />
      <Label x={118} y={126} w={124} h={220} p={p} tone={t} small />
    </g>
  ),
};

// Slim packs are enlarged so their labels stay readable in small cards.
const SCALE = { bottle: 1.18, tub: 1.12, box: 1.08, gel: 1.06, sachet: 1, jerrycan: 1 };

const PackShot = ({ product: p, className = '' }) => {
  if (p.image_url) return <img className={`packshot ${className}`} src={p.image_url} alt={`${p.brand} ${p.name} ${p.pack_size}`} loading="lazy" />;
  const t = toneFor(p.brand);
  const draw = Shapes[p.pack_style] || Shapes.bottle;
  return (
    <svg className={`packshot ${className}`} viewBox="0 0 400 420" role="img" aria-label={`${p.brand} ${p.name} ${p.pack_size} pack illustration`}>
      <ellipse cx="200" cy="392" rx="118" ry="12" fill="#000" opacity="0.08" />
      <g transform={`translate(200 205) scale(${SCALE[p.pack_style] || 1.18}) translate(-200 -205)`}>{draw(p, t)}</g>
    </svg>
  );
};

export default PackShot;
