// 배포 멍멍이. pose='think' 는 다리 꼬고 턱 괴고 고민, pose='eureka' 는 띠용.
// 눈동자 확대 기준점이 그림 전체 중심이라 띠용 때 눈 밖으로 튀어나가는데, 일부러 유지한다.

type DogProps = {
  pose?: 'think' | 'eureka'
  still?: boolean // 크기 변화 없이 포즈만 (작은 강아지용)
  decor?: boolean // 생각 방울 / 폭발 / 띠용 글자
  className?: string
}

export function Dog({ pose = 'think', still = false, decor = false, className = '' }: DogProps) {
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
