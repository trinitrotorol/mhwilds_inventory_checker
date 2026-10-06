import { useId, useState } from 'react'

export function QuantityEditor({ name, value, disabled, onChange, onAdjust }: { name: string; value: number; disabled?: boolean; onChange: (value: number) => void; onAdjust: (delta: number) => void }) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState('')
  function commit() {
    if (draft === null) return
    if (!/^\d+$/.test(draft) || !Number.isSafeInteger(Number(draft))) {
      setError('0以上の安全な整数を入力してください。空欄・小数は保存されません。')
      return
    }
    onChange(Number(draft))
    setDraft(null)
    setError('')
  }
  return <div className="quantity-control">
    <div className="quantity-buttons">
      <button type="button" disabled={disabled || value === 0} aria-label={`${name}を1個減らす`} onClick={() => { setDraft(null); setError(''); onAdjust(-1) }}>−</button>
      <input id={id} type="text" inputMode="numeric" aria-label={`${name}の所持数`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} disabled={disabled} value={draft ?? String(value)} onChange={(event) => { setDraft(event.target.value); setError('') }} onBlur={commit} onKeyDown={(event) => {
        if (event.key === 'Enter') { event.preventDefault(); commit() }
        if (event.key === 'Escape') { setDraft(null); setError('') }
      }} />
      <button type="button" disabled={disabled || value === Number.MAX_SAFE_INTEGER} aria-label={`${name}を1個増やす`} onClick={() => { setDraft(null); setError(''); onAdjust(1) }}>＋</button>
    </div>
    {error && <p id={`${id}-error`} className="field-error">{error}</p>}
  </div>
}
