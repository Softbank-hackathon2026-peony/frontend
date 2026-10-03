// 배포 멍멍이. pose='think' 는 다리 꼬고 턱 괴고 고민, pose='eureka' 는 띠용.
// 눈동자 확대 기준점이 그림 전체 중심이라 띠용 때 눈 밖으로 튀어나가는데, 일부러 유지한다.

type DogProps = {
  pose?: 'think' | 'eureka' | 'typing'
  still?: boolean // 크기 변화 없이 포즈만 (작은 강아지용)
  decor?: boolean // 생각 방울 / 폭발 / 띠용 글자
  className?: string
}

// 뒷모습으로 노트북을 폭풍 타이핑하는 포즈 (만드는 중 화면)
function DogTyping() {
  return (
    <svg className="dog typing" viewBox="0 0 320 380" aria-hidden="true">
      <ellipse cx="160" cy="352" rx="124" ry="14" fill="rgba(0,0,0,.10)" />
      <ellipse cx="160" cy="318" rx="108" ry="26" fill="#6C7BD9" />
      <ellipse cx="160" cy="308" rx="108" ry="26" fill="#9AA6F5" stroke="var(--ink)" strokeWidth="2.5" />
      {/* 노트북: 강아지 앞(화면상 위)에 뚜껑 뒷면이 머리 위로 보인다 */}
      <g className="laptop">
        <rect x="56" y="178" width="208" height="14" rx="5" fill="#2F3340" />
        <rect x="64" y="60" width="192" height="126" rx="12" fill="#3B3F4A" stroke="var(--ink)" strokeWidth="2.5" />
        <rect x="72" y="68" width="176" height="110" rx="8" fill="#4A4F5C" />
        <g fill="#C9CCD6" opacity=".9" transform="translate(0 -36)">
          <ellipse cx="152" cy="140" rx="3.2" ry="4.2" /><ellipse cx="160" cy="137" rx="3.2" ry="4.2" /><ellipse cx="168" cy="140" rx="3.2" ry="4.2" />
          <ellipse cx="147" cy="149" rx="2.8" ry="3.6" /><ellipse cx="173" cy="149" rx="2.8" ry="3.6" />
          <path d="M160 145c-6 0-11 5-11 10 0 3.4 2.4 5.6 5.3 5.6 2 0 3.6-1 5.7-1s3.7 1 5.7 1c2.9 0 5.3-2.2 5.3-5.6 0-5-5-10-11-10z" />
        </g>
        <rect x="64" y="60" width="192" height="6" rx="3" fill="#7F8BFF" opacity=".55" />
      </g>
      {/* 타이핑 효과 */}
      <g className="sparks" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round">
        <path className="sp1" d="M52 180l-9-10M46 192l-13-1" /><path className="sp2" d="M268 180l9-10M274 192l13-1" />
      </g>
      {/* 꼬리 */}
      <path className="tail" d="M182 318C214 318 236 290 238 262" fill="none" stroke="var(--fur)" strokeWidth="16" strokeLinecap="round" />
      {/* 몸통(등) */}
      <ellipse cx="160" cy="252" rx="74" ry="82" fill="var(--fur)" />
      {/* 양옆으로 삐져나온 뒷발 */}
      <ellipse cx="92" cy="322" rx="20" ry="13" fill="var(--fur-dark)" />
      <ellipse cx="228" cy="322" rx="20" ry="13" fill="var(--fur-dark)" />
      {/* 머리(뒤통수) + 귀 */}
      <g className="head">
        <ellipse cx="100" cy="174" rx="22" ry="40" fill="var(--fur-dark)" transform="rotate(14 100 174)" />
        <ellipse cx="220" cy="174" rx="22" ry="40" fill="var(--fur-dark)" transform="rotate(-14 220 174)" />
        <circle cx="160" cy="166" r="56" fill="var(--fur)" />
        <path d="M150 114q10-10 20 0" fill="none" stroke="var(--fur-dark)" strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* 팔: 어깨에서 노트북 자판(위)으로, 머리 앞에 그린다 */}
      <g className="arm-l"><path d="M98 252C70 244 58 220 70 200" fill="none" stroke="var(--fur)" strokeWidth="18" strokeLinecap="round" /><circle cx="70" cy="194" r="12" fill="var(--fur-dark)" stroke="var(--fur)" strokeWidth="2" /></g>
      <g className="arm-r"><path d="M222 252C250 244 262 220 250 200" fill="none" stroke="var(--fur)" strokeWidth="18" strokeLinecap="round" /><circle cx="250" cy="194" r="12" fill="var(--fur-dark)" stroke="var(--fur)" strokeWidth="2" /></g>
    </svg>
  )
}

export function Dog({ pose = 'think', still = false, decor = false, className = '' }: DogProps) {
  if (pose === 'typing') return <div className={['dogwrap', 'typing', className].filter(Boolean).join(' ')}><DogTyping /></div>
  const cls = ['dogwrap', pose === 'eureka' ? 'eureka' : '', still ? 'still' : '', className].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      {decor && (
        <>
          <div className="burst" aria-hidden="true">
            <svg viewBox="0 0 200 200">
              <g className="ray" transform="translate(100 100)">
                {Array.from({ length: 12 }, (_, i) => <line key={i} x1="0" y1="-60" x2="0" y2="-92" transform={`rotate(${i * 30})`} />)}
              </g>
            </svg>
          </div>
          <div className="thinks" aria-hidden="true"><i /><i /><i /></div>
          <div className="ddiyong" aria-hidden="true">띠용!</div>
        </>
      )}
      <svg className="dog" viewBox="0 0 320 380" aria-hidden="true">
        <ellipse cx="160" cy="352" rx="124" ry="14" fill="rgba(0,0,0,.10)" />
        <ellipse cx="160" cy="318" rx="108" ry="26" fill="#6C7BD9" />
        <ellipse cx="160" cy="308" rx="108" ry="26" fill="#9AA6F5" stroke="var(--ink)" strokeWidth="2.5" />
        <path className="tail" d="M214 262 C 262 252 282 214 268 190" fill="none" stroke="var(--fur)" strokeWidth="18" strokeLinecap="round" />
        <path d="M132 276 C 122 304 116 322 108 336" fill="none" stroke="var(--fur)" strokeWidth="24" strokeLinecap="round" />
        <ellipse cx="104" cy="338" rx="20" ry="13" fill="var(--fur-dark)" />
        <ellipse cx="160" cy="222" rx="74" ry="84" fill="var(--fur)" />
        <ellipse cx="160" cy="236" rx="46" ry="60" fill="var(--fur-light)" />
        <g className="foot-top">
          <path d="M186 268 C 196 300 150 306 112 302" fill="none" stroke="var(--fur)" strokeWidth="24" strokeLinecap="round" />
          <ellipse cx="102" cy="302" rx="21" ry="13" fill="var(--fur-dark)" />
        </g>
        <path d="M100 210 C 88 240 100 262 128 272" fill="none" stroke="var(--fur)" strokeWidth="20" strokeLinecap="round" />
        <circle cx="132" cy="274" r="12" fill="var(--fur-dark)" />
        <ellipse cx="108" cy="112" rx="22" ry="40" fill="var(--fur-dark)" transform="rotate(14 108 112)" />
        <ellipse cx="216" cy="112" rx="22" ry="40" fill="var(--fur-dark)" transform="rotate(-14 216 112)" />
        <circle cx="162" cy="108" r="60" fill="var(--fur)" />
        <ellipse cx="162" cy="138" rx="30" ry="22" fill="var(--fur-light)" />
        <path className="brow brow-l" d="M126 84 q12 -7 24 -2" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
        <path className="brow brow-r" d="M174 82 q12 -5 24 2" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
        <g>
          <circle className="eye-white" cx="138" cy="104" r="11" fill="#fff" stroke="var(--ink)" strokeWidth="2.5" style={{ transformOrigin: '138px 104px' }} />
          <circle className="pupil" cx="138" cy="104" r="5" fill="var(--ink)" />
          <rect className="lid" x="126" y="92" width="24" height="24" rx="12" fill="var(--fur)" />
        </g>
        <g>
          <circle className="eye-white" cx="186" cy="104" r="11" fill="#fff" stroke="var(--ink)" strokeWidth="2.5" style={{ transformOrigin: '186px 104px' }} />
          <circle className="pupil" cx="186" cy="104" r="5" fill="var(--ink)" />
          <rect className="lid" x="174" y="92" width="24" height="24" rx="12" fill="var(--fur)" />
        </g>
        <ellipse cx="118" cy="128" rx="9" ry="5" fill="#FF9AA2" opacity=".7" />
        <ellipse cx="206" cy="128" rx="9" ry="5" fill="#FF9AA2" opacity=".7" />
        <ellipse cx="162" cy="130" rx="9" ry="6.5" fill="var(--ink)" />
        <path className="mouth-line" d="M150 150 q12 -6 24 0" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
        <g className="mouth-open">
          <ellipse cx="162" cy="152" rx="12" ry="14" fill="var(--ink)" />
          <ellipse cx="162" cy="160" rx="7" ry="5" fill="#FF8A8A" />
        </g>
        <path className="sweat" d="M226 74 q8 12 0 16 q-8 -4 0 -16z" fill="#7FC3FF" />
        <g className="arm-chin">
          <path d="M222 208 C 254 224 246 170 206 158" fill="none" stroke="var(--fur)" strokeWidth="20" strokeLinecap="round" />
          <circle cx="202" cy="156" r="13" fill="var(--fur-dark)" />
        </g>
      </svg>
    </div>
  )
}
