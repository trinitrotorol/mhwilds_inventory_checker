import { useId, useState } from 'react'
import { useLocale } from '../i18n/context'

export function QuantityEditor({ name, value, revision, disabled, onChange, onAdjust }: { name: string; value: number; revision: number; disabled?: boolean; onChange: (value: number, expectedRevision: number) => boolean; onAdjust: (delta: number) => void }) {
  const { t } = useLocale()
  const id = useId()
  const [draft, setDraft] = useState<{ value: string; revision: number } | null>(null)
  const [error, setError] = useState('')
  const stale = draft !== null && draft.revision !== revision
  const message = stale ? t("編集中に保存内容が更新されました。入力中の値は未保存です。最新の保存値は{0}個です。確認してから入力し直してください。", value) : error
  function commit() {
    if (draft === null || stale) return
    if (!/^\d+$/.test(draft.value) || !Number.isSafeInteger(Number(draft.value))) {
      setError(t("0以上の安全な整数を入力してください。空欄・小数は保存されません。"))
      return
    }
    if (!onChange(Number(draft.value), draft.revision)) {
      setError(t("保存内容が更新されています。入力中の値は未保存です。最新の保存値を確認してください。"))
      return
    }
    setDraft(null)
    setError('')
  }
  return <div className="quantity-control">
    <div className="quantity-buttons">
      <button type="button" disabled={disabled || stale || value === 0} aria-label={t("{0}を1個減らす", name)} onClick={() => { setDraft(null); setError(''); onAdjust(-1) }}>−</button>
      <input id={id} type="text" inputMode="numeric" aria-label={t("{0}の所持数", name)} aria-invalid={Boolean(message)} aria-describedby={message ? `${id}-error` : undefined} disabled={disabled} value={draft?.value ?? String(value)} onChange={(event) => { const value = event.target.value; setDraft((current) => ({ value, revision: current?.revision ?? revision })); setError('') }} onBlur={commit} onKeyDown={(event) => {
        if (event.key === 'Enter') { event.preventDefault(); commit() }
        if (event.key === 'Escape') { setDraft(null); setError('') }
      }} />
      <button type="button" disabled={disabled || stale || value === Number.MAX_SAFE_INTEGER} aria-label={t("{0}を1個増やす", name)} onClick={() => { setDraft(null); setError(''); onAdjust(1) }}>＋</button>
    </div>
    {message && <p id={`${id}-error`} className="field-error" role="alert">{t(message)}</p>}
    {stale && <button type="button" onClick={() => { setDraft(null); setError('') }} aria-label={t("{0}の入力を最新の保存値に戻す", name)}>{t("最新の保存値に戻す")}</button>}
  </div>
}
