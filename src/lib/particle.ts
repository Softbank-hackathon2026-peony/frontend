// 대상 이름(AWS Lambda, Google Cloud Run, EC2 …) 끝소리에 맞춰 한국어 조사를 붙인다.
function lastSound(s: string): { consonant: boolean; rieul: boolean } {
  const t = s.replace(/[\s)\]"'’”]+$/g, '')
  const ch = t[t.length - 1] ?? ''
  const code = ch.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) { const jong = (code - 0xac00) % 28; return { consonant: jong !== 0, rieul: jong === 8 } }
  if (/[0-9]/.test(ch)) { return { consonant: '013678'.includes(ch), rieul: '178'.includes(ch) } } // 영일삼육칠팔 / 일칠팔
  if (/[a-z]/i.test(ch)) { const v = /[aeiou]/i.test(ch); return { consonant: !v, rieul: /l/i.test(ch) } }
  return { consonant: false, rieul: false }
}
/** 을/를 */
export const eul = (s: string) => s + (lastSound(s).consonant ? '을' : '를')
/** 으로/로 */
export const euro = (s: string) => { const l = lastSound(s); return s + (l.consonant && !l.rieul ? '으로' : '로') }
/** 이/가 */
export const iga = (s: string) => s + (lastSound(s).consonant ? '이' : '가')
