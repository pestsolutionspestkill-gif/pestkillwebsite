import { useId } from 'react';
import './PipeDiagram.css';

/* ------------------------------------------------------------------
   Shared drawing pieces
------------------------------------------------------------------- */
const C = {
  navy: '#0B1F3A', soil: '#E8D8BE', soilDot: '#C9B38E', concrete: '#A4AFBD', concreteDark: '#7C8899',
  wall: '#F4F1EA', wallEdge: '#CFC7B8', wood: '#8B5A2B', green: '#0E9F6E', greenLight: '#34C38F',
  red: '#D92D20', sky: '#EEF4FA', ink: '#1A2433',
};

const Termite = ({ x, y, angle = 0, scale = 1, color = '#F1E2B8', stroke = '#8A6A2F' }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
    <g stroke={stroke} strokeWidth="1.2" strokeLinecap="round">
      <path d="M-4 -4 L-9 -9 M0 -4 L0 -10 M4 -4 L9 -9 M-4 4 L-9 9 M0 4 L0 10 M4 4 L9 9" />
      <path d="M13 -2 L19 -7 M13 2 L19 7" />
    </g>
    <ellipse cx="-5" cy="0" rx="9" ry="5" fill={color} stroke={stroke} strokeWidth="1" />
    <ellipse cx="6" cy="0" rx="4" ry="3.4" fill={color} stroke={stroke} strokeWidth="1" />
    <circle cx="12" cy="0" r="3.6" fill="#D9A441" stroke={stroke} strokeWidth="1" />
  </g>
);

const Stop = ({ x, y, r = 13 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#fff" stroke={C.red} strokeWidth="3" />
    <path d={`M${-r * 0.45} ${-r * 0.45} L${r * 0.45} ${r * 0.45} M${r * 0.45} ${-r * 0.45} L${-r * 0.45} ${r * 0.45}`} stroke={C.red} strokeWidth="3.4" strokeLinecap="round" />
  </g>
);

const Check = ({ x, y, r = 13 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill={C.green} />
    <path d={`M${-r * 0.45} 0 L${-r * 0.1} ${r * 0.38} L${r * 0.5} ${-r * 0.35}`} fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const Badge = ({ x, y, n }) => (
  <g transform={`translate(${x} ${y})`} className="pd-badge">
    <circle r="15" fill={C.navy} stroke="#fff" strokeWidth="3" />
    <text y="5.5" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">{n}</text>
  </g>
);

const SoilPattern = ({ id }) => (
  <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
    <circle cx="4" cy="5" r="1.6" fill={C.soilDot} />
    <circle cx="13" cy="12" r="1.2" fill={C.soilDot} />
    <circle cx="9" cy="16" r="0.9" fill={C.soilDot} />
  </pattern>
);

const Label = ({ x, y, hi, en, anchor = 'start', color = C.ink, size = 15 }) => (
  <g className="pd-label">
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight="700" fill={color}>{hi}</text>
    <text x={x} y={y + size + 2} textAnchor={anchor} fontSize={size - 3} fontWeight="500" fill={color} opacity="0.75">{en}</text>
  </g>
);

/* ------------------------------------------------------------------
   Panel 1 — Without treatment
------------------------------------------------------------------- */
export const WithoutTreatment = () => {
  const soil = useId();
  return (
    <svg viewBox="0 0 440 320" className="pd-svg" role="img" aria-label="Without treatment, termites climb from the soil through mud tubes into the wall and the wooden door">
      <defs><SoilPattern id={soil} /></defs>
      <rect width="440" height="200" fill={C.sky} />
      <rect y="200" width="440" height="120" fill={C.soil} />
      <rect y="200" width="440" height="120" fill={`url(#${soil})`} />
      {/* wall and door */}
      <rect x="90" y="40" width="260" height="160" fill={C.wall} stroke={C.wallEdge} strokeWidth="2" />
      <rect x="80" y="196" width="280" height="14" fill={C.concrete} />
      <rect x="230" y="88" width="62" height="112" rx="3" fill={C.wood} />
      <circle cx="282" cy="146" r="3.5" fill="#E0B97A" />
      {/* damage on door */}
      <g fill="#5B3716">
        <ellipse cx="248" cy="178" rx="7" ry="4" /><ellipse cx="262" cy="166" rx="5" ry="3" /><ellipse cx="243" cy="158" rx="4" ry="2.6" />
        <ellipse cx="270" cy="186" rx="6" ry="3.2" /><ellipse cx="255" cy="140" rx="3.5" ry="2.2" />
      </g>
      {/* mud tube climbing the wall */}
      <path d="M150 300 C 150 260, 160 240, 158 200 C 156 160, 170 140, 230 132" fill="none" stroke="#9C7A4A" strokeWidth="10" strokeLinecap="round" />
      <path d="M150 300 C 150 260, 160 240, 158 200 C 156 160, 170 140, 230 132" fill="none" stroke="#B89463" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 6" />
      {/* termites marching up */}
      <g className="pd-march">
        <Termite x={150} y={292} angle={-90} />
        <Termite x={152} y={258} angle={-95} />
        <Termite x={158} y={214} angle={-88} />
        <Termite x={160} y={170} angle={-70} />
        <Termite x={205} y={136} angle={-8} />
      </g>
      {/* colony in soil */}
      <g opacity="0.95">
        <Termite x={70} y={262} angle={20} /><Termite x={98} y={290} angle={-30} /><Termite x={60} y={300} angle={10} />
        <Termite x={340} y={280} angle={160} /><Termite x={380} y={256} angle={200} />
      </g>
      <Stop x={300} y={70} r={20} />
      <Label x={20} y={30} hi="बिना ट्रीटमेंट" en="Without treatment" color={C.red} size={17} />
      <Label x={238} y={288} hi="मिट्टी" en="Soil" size={13} />
    </svg>
  );
};

/* ------------------------------------------------------------------
   Panel 2 — Main cross-section with porous pipe system
------------------------------------------------------------------- */
export const CrossSection = () => {
  const soil = useId();
  const pipeGrad = useId();
  return (
    <svg viewBox="0 0 960 600" className="pd-svg" role="img" aria-label="Cross-section of a house: porous pipes under the floor release anti-termite chemical into the soil, forming a green protective layer. Termites coming from below are stopped. A refill point outside the house is used to add chemical again in future.">
      <defs>
        <SoilPattern id={soil} />
        <linearGradient id={pipeGrad} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3BD69B" /><stop offset="1" stopColor="#0A7A55" />
        </linearGradient>
      </defs>

      {/* sky & soil */}
      <rect width="960" height="262" fill={C.sky} />
      <rect y="262" width="960" height="338" fill={C.soil} />
      <rect y="262" width="960" height="338" fill={`url(#${soil})`} />

      {/* green protective zone */}
      <rect x="128" y="274" width="664" height="96" rx="18" fill="rgba(14,159,110,0.18)" stroke={C.green} strokeWidth="2.5" strokeDasharray="10 7" className="pd-zone" />

      {/* footings */}
      {[180, 455, 730].map((x) => (
        <g key={x}>
          <rect x={x - 22} y="282" width="44" height="130" fill={C.concrete} stroke={C.concreteDark} strokeWidth="1.5" />
          <rect x={x - 44} y="402" width="88" height="22" fill={C.concrete} stroke={C.concreteDark} strokeWidth="1.5" />
        </g>
      ))}

      {/* plinth beam & floor */}
      <rect x="150" y="252" width="620" height="30" fill={C.concreteDark} />
      <rect x="200" y="238" width="520" height="16" fill={C.concrete} />

      {/* walls */}
      <rect x="158" y="96" width="44" height="158" fill={C.wall} stroke={C.wallEdge} strokeWidth="2" />
      <rect x="433" y="96" width="44" height="158" fill={C.wall} stroke={C.wallEdge} strokeWidth="2" />
      <rect x="708" y="96" width="44" height="158" fill={C.wall} stroke={C.wallEdge} strokeWidth="2" />
      <rect x="202" y="96" width="231" height="142" fill="#FBFAF6" />
      <rect x="477" y="96" width="231" height="142" fill="#FBFAF6" />
      {/* roof */}
      <path d="M130 100 L455 22 L780 100 Z" fill={C.navy} />
      <rect x="140" y="92" width="630" height="10" fill="#12294A" />
      {/* door, window */}
      <rect x="270" y="140" width="56" height="98" rx="3" fill={C.wood} />
      <circle cx="317" cy="190" r="3.5" fill="#E0B97A" />
      <rect x="555" y="128" width="84" height="64" rx="3" fill="#CFE6F5" stroke="#8EA9BF" strokeWidth="3" />
      <path d="M597 128 V192 M555 160 H639" stroke="#8EA9BF" strokeWidth="3" />
      {/* family inside — safe */}
      <g fill={C.navy}>
        <circle cx="380" cy="168" r="10" /><rect x="369" y="180" width="22" height="40" rx="9" />
        <circle cx="404" cy="186" r="7" /><rect x="396" y="195" width="16" height="26" rx="7" />
      </g>
      <Check x={410} y={130} r={15} />

      {/* the porous pipe */}
      <path d="M140 320 H800" stroke="#0A5E42" strokeWidth="18" strokeLinecap="round" />
      <path d="M140 320 H800" stroke={`url(#${pipeGrad})`} strokeWidth="13" strokeLinecap="round" />
      <g fill="#E9FFF5">{Array.from({ length: 33 }, (_, i) => <circle key={i} cx={152 + i * 20} cy="320" r="2.2" />)}</g>
      <path d="M140 320 H800" stroke="#BFF5DD" strokeWidth="4" strokeDasharray="6 14" className="pd-flow" />

      {/* chemical seeping out */}
      <g fill={C.greenLight} className="pd-seep">
        {Array.from({ length: 22 }, (_, i) => {
          const x = 160 + i * 29;
          return (
            <g key={i}>
              <circle cx={x} cy={300 - (i % 3) * 6} r="3" />
              <circle cx={x + 12} cy={344 + (i % 2) * 7} r="2.6" />
            </g>
          );
        })}
      </g>

      {/* refill point outside */}
      <path d="M800 320 H850 V214" fill="none" stroke="#0A5E42" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M800 320 H850 V214" fill="none" stroke={`url(#${pipeGrad})`} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M850 214 V320 H800" fill="none" stroke="#BFF5DD" strokeWidth="4" strokeDasharray="6 14" className="pd-flow" />
      <rect x="826" y="190" width="48" height="30" rx="6" fill={C.navy} />
      <rect x="836" y="182" width="28" height="12" rx="3" fill="#12294A" />
      {/* spray tank pouring in */}
      <g transform="translate(880 92)">
        <rect x="0" y="0" width="54" height="78" rx="12" fill="#F2B705" stroke="#B58700" strokeWidth="2" />
        <rect x="14" y="-10" width="26" height="14" rx="4" fill="#B58700" />
        <path d="M27 18 l-9 16 h18 z" fill="#fff" opacity="0.85" />
        <path d="M0 64 C -30 64, -32 92, -20 98" fill="none" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
      </g>
      <path d="M856 140 V176" stroke={C.green} strokeWidth="4" markerEnd="none" />
      <path d="M848 168 L856 182 L864 168" fill="none" stroke={C.green} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* termites trying to enter — stopped at the green layer */}
      <g className="pd-approach">
        <Termite x={250} y={476} angle={-70} scale={1.45} /><Termite x={262} y={420} angle={-82} scale={1.45} />
        <Termite x={470} y={528} angle={-95} scale={1.45} /><Termite x={520} y={474} angle={-110} scale={1.45} />
        <Termite x={640} y={500} angle={-80} scale={1.45} /><Termite x={130} y={456} angle={-70} scale={1.45} />
        <Termite x={772} y={474} angle={-100} scale={1.45} />
      </g>
      {[[262, 384], [520, 386], [652, 390], [148, 392], [764, 392]].map(([x, y]) => <Stop key={`${x}${y}`} x={x} y={y} r={14} />)}
      {/* dashed paths showing they turn back */}
      <g fill="none" stroke={C.red} strokeWidth="2.5" strokeDasharray="5 6" opacity="0.7">
        <path d="M262 400 C 280 430, 300 450, 290 500" /><path d="M520 402 C 545 430, 560 460, 560 520" />
      </g>

      {/* numbered callouts */}
      <Badge x={232} y={218} n="1" />
      <Badge x={170} y={322} n="2" />
      <Badge x={760} y={292} n="3" />
      <Badge x={900} y={205} n="4" />
      <Badge x={330} y={390} n="5" />

      {/* labels */}
      <Label x={30} y={40} hi="पोरस पाइप ट्रीटमेंट के साथ" en="With porous pipe treatment" color={C.green} size={18} />
      <Label x={20} y={262} hi="ज़मीन" en="Ground level" size={13} />
      <Label x={20} y={560} hi="मिट्टी" en="Soil" size={13} />
      <Label x={600} y={566} hi="↑ दीमक नीचे से आती है" en="Termites come up from below" color={C.red} size={15} />
      <Label x={470} y={450} hi="नींव" en="Foundation" size={13} anchor="middle" />
    </svg>
  );
};

/* ------------------------------------------------------------------
   Panel 3 — Top view
------------------------------------------------------------------- */
export const TopView = () => (
  <svg viewBox="0 0 440 348" className="pd-svg" role="img" aria-label="Top view of a house plan: green pipes run under every wall and connect to a refill point outside the house">
    <rect width="440" height="348" fill="#F7F9FB" />
    {/* plot */}
    <rect x="30" y="30" width="330" height="260" fill="#EDE3D1" rx="6" />
    {/* rooms */}
    <g fill="#FBFAF6" stroke={C.concreteDark} strokeWidth="6">
      <rect x="60" y="60" width="270" height="200" />
    </g>
    <path d="M190 60 V260 M60 160 H190 M190 190 H330" stroke={C.concreteDark} strokeWidth="6" />
    {/* pipes under walls */}
    <g fill="none" stroke={C.green} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
      <rect x="48" y="48" width="294" height="224" rx="4" />
      <path d="M190 48 V272 M48 160 H190 M190 190 H342" />
    </g>
    <g fill="none" stroke="#BFF5DD" strokeWidth="2.5" strokeDasharray="4 9" className="pd-flow">
      <rect x="48" y="48" width="294" height="224" rx="4" />
      <path d="M190 48 V272 M48 160 H190 M190 190 H342" />
    </g>
    {/* connection to refill point */}
    <path d="M342 150 H392" stroke={C.green} strokeWidth="7" strokeLinecap="round" />
    <rect x="384" y="134" width="34" height="32" rx="6" fill={C.navy} />
    <Badge x={401} y={110} n="4" />
    {/* room labels */}
    <text x="125" y="115" textAnchor="middle" fontSize="13" fontWeight="600" fill={C.ink}>कमरा</text>
    <text x="125" y="215" textAnchor="middle" fontSize="13" fontWeight="600" fill={C.ink}>रसोई</text>
    <text x="260" y="130" textAnchor="middle" fontSize="13" fontWeight="600" fill={C.ink}>हॉल</text>
    <text x="260" y="232" textAnchor="middle" fontSize="13" fontWeight="600" fill={C.ink}>कमरा</text>
    <Label x={30} y={314} hi="पाइप हर दीवार के नीचे · ऊपर से देखें" en="Pipe under every wall · view from top" color={C.green} size={14} />
  </svg>
);

/* ------------------------------------------------------------------
   Panel 4 — Four steps as pictures
------------------------------------------------------------------- */
const StepPipe = () => (
  <svg viewBox="0 0 200 130" className="pd-step-svg" aria-hidden="true">
    <rect width="200" height="130" fill="#F7F9FB" />
    <rect y="50" width="200" height="80" fill={C.soil} />
    <rect x="20" y="60" width="160" height="34" rx="4" fill="#D6C29F" />
    <path d="M30 78 H170" stroke={C.green} strokeWidth="12" strokeLinecap="round" />
    <g fill="#E9FFF5">{[40, 60, 80, 100, 120, 140, 160].map((x) => <circle key={x} cx={x} cy="78" r="2" />)}</g>
    <path d="M100 18 V44 M90 34 L100 46 L110 34" stroke={C.navy} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const StepFloor = () => (
  <svg viewBox="0 0 200 130" className="pd-step-svg" aria-hidden="true">
    <rect width="200" height="130" fill="#F7F9FB" />
    <rect y="62" width="200" height="68" fill={C.soil} />
    <rect x="10" y="44" width="180" height="22" fill={C.concrete} stroke={C.concreteDark} strokeWidth="2" />
    <path d="M30 88 H170" stroke={C.green} strokeWidth="12" strokeLinecap="round" />
    <g fill="#E9FFF5">{[40, 60, 80, 100, 120, 140, 160].map((x) => <circle key={x} cx={x} cy="88" r="2" />)}</g>
    <path d="M60 14 H140 M100 14 V36" stroke={C.navy} strokeWidth="4" strokeLinecap="round" />
  </svg>
);
const StepFill = () => (
  <svg viewBox="0 0 200 130" className="pd-step-svg" aria-hidden="true">
    <rect width="200" height="130" fill="#F7F9FB" />
    <rect y="62" width="200" height="68" fill={C.soil} />
    <rect x="0" y="54" width="130" height="12" fill={C.concrete} />
    <path d="M10 96 H160 V60" stroke={C.green} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="146" y="44" width="28" height="18" rx="4" fill={C.navy} />
    <rect x="160" y="6" width="30" height="36" rx="7" fill="#F2B705" />
    <g fill={C.greenLight}>{[30, 55, 80, 105, 130].map((x) => <g key={x}><circle cx={x} cy="84" r="3" /><circle cx={x + 10} cy="110" r="2.6" /></g>)}</g>
  </svg>
);
const StepRefill = () => (
  <svg viewBox="0 0 200 130" className="pd-step-svg" aria-hidden="true">
    <rect width="200" height="130" fill="#F7F9FB" />
    <rect x="22" y="20" width="76" height="78" rx="8" fill="#fff" stroke={C.navy} strokeWidth="3" />
    <rect x="22" y="20" width="76" height="20" rx="8" fill={C.navy} />
    <g fill={C.green}>{[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={32 + c * 20} y={48 + r * 15} width="14" height="9" rx="2" />))}</g>
    <path d="M150 22 l34 12 v26 c0 22 -15 36 -34 44 c-19 -8 -34 -22 -34 -44 v-26 z" fill={C.green} />
    <path d="M136 62 l10 10 l20 -20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <text x="150" y="122" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.navy}>10–15</text>
  </svg>
);

export const steps = [
  { Pic: StepPipe, hi: 'पाइप बिछाएं', en: 'Lay the pipes', note: 'नींव के पास, फर्श से पहले · Near the foundation, before flooring' },
  { Pic: StepFloor, hi: 'फर्श डालें', en: 'Lay the floor', note: 'पाइप फर्श के नीचे छुप जाते हैं · Pipes stay hidden under the floor' },
  { Pic: StepFill, hi: 'दवा भरें', en: 'Fill the chemical', note: 'बाहर के पॉइंट से दवा पाइप में · Chemical goes in from the outside point' },
  { Pic: StepRefill, hi: 'सालों तक सुरक्षा', en: 'Years of protection', note: 'ज़रूरत पर दोबारा भरें, फर्श नहीं तोड़ना · Refill when needed, no breaking the floor' },
];

export const legend = [
  { n: '1', hi: 'फर्श', en: 'Floor — stays untouched', swatch: C.concrete },
  { n: '2', hi: 'छेद वाला पोरस पाइप', en: 'Porous pipe with tiny holes', swatch: C.green },
  { n: '3', hi: 'दीमक-रोधी दवा की सुरक्षा परत', en: 'Green layer of anti-termite chemical in the soil', swatch: 'rgba(14,159,110,0.35)' },
  { n: '4', hi: 'रीफिल पॉइंट (घर के बाहर)', en: 'Refill point outside the house', swatch: C.navy },
  { n: '5', hi: 'दीमक यहीं रुक जाती है', en: 'Termites are stopped here', swatch: C.red },
];

/* ------------------------------------------------------------------
   Full explainer
------------------------------------------------------------------- */
const PipeDiagram = () => (
  <div className="pd">
    <div className="pd-compare">
      <figure className="pd-card pd-bad">
        <span className="pd-tag bad">✕ समस्या · Problem</span>
        <WithoutTreatment />
        <figcaption>
          <strong>दीमक मिट्टी से निकलकर दीवार और लकड़ी तक पहुंच जाती है।</strong>
          <span>Termites come up from the soil and reach walls, doors and furniture.</span>
        </figcaption>
      </figure>
      <figure className="pd-card pd-good">
        <span className="pd-tag good">✓ समाधान · Solution</span>
        <TopView />
        <figcaption>
          <strong>पाइप हर दीवार के नीचे बिछते हैं और बाहर एक रीफिल पॉइंट होता है।</strong>
          <span>Pipes run under every wall and join one refill point outside.</span>
        </figcaption>
      </figure>
    </div>

    <figure className="pd-card pd-main">
      <CrossSection />
      <ol className="pd-legend">
        {legend.map((l) => (
          <li key={l.n}>
            <span className="pd-legend-n">{l.n}</span>
            <span className="pd-legend-sw" style={{ background: l.swatch }} />
            <span><strong>{l.hi}</strong><small>{l.en}</small></span>
          </li>
        ))}
      </ol>
    </figure>

    <ol className="pd-steps">
      {steps.map(({ Pic, hi, en, note }, i) => (
        <li key={hi} className="pd-step">
          <span className="pd-step-n">{i + 1}</span>
          <Pic />
          <strong>{hi}</strong>
          <span className="pd-step-en">{en}</span>
          <small>{note}</small>
        </li>
      ))}
    </ol>
  </div>
);

export default PipeDiagram;
