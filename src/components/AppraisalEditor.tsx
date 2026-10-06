import { useState } from 'react'
import { validateAppraisalCharm } from '../domain'
import type { AppraisalCharm, CheckerCatalog, Slot } from '../domain'
import { appraisalTemplate, itemName } from '../ui/selectors'
import { Modal } from './Modal'

export function AppraisalEditor({ catalog, initial, title, stale, onClose, onSave }: { catalog: CheckerCatalog; initial: AppraisalCharm; title: string; stale: boolean; onClose: () => void; onSave: (value: AppraisalCharm) => void }) {
  const [draft, setDraft] = useState(initial)
  const [quantity, setQuantity] = useState(String(initial.quantity))
  const quantityValid = /^\d+$/.test(quantity) && Number.isSafeInteger(Number(quantity)) && Number(quantity) > 0
  const validation = validateAppraisalCharm(draft, catalog)
  const skills = [...catalog.skills].sort((a, b) => itemName(a.display_name, a.skill_id).localeCompare(itemName(b.display_name, b.skill_id), 'ja'))
  function applyPattern(id: string) {
    setDraft(appraisalTemplate(catalog, id, draft))
  }
  return <Modal title={title} onClose={onClose}>
    <form onSubmit={(event) => { event.preventDefault(); if (validation.status === 'valid' && quantityValid && !stale) onSave({ ...draft, quantity: Number(quantity) }) }}>
      <p className="muted">ゲーム内の表示に合わせて能力を入力してください。スキル・レベル・スロットの組合せを実カタログの鑑定ルールで検証します。</p>
      {stale && <p className="notice error" role="alert">編集中に所持情報が更新されました。変更を控え、この画面を閉じて最新の内容から編集し直してください。</p>}
      <label>ルールから入力を開始<select defaultValue="" onChange={(event) => applyPattern(event.target.value)}><option value="">パターンを選択（任意）</option>{catalog.appraisal_charm_patterns.map((pattern) => <option key={pattern.pattern_id} value={pattern.pattern_id}>RARE {pattern.rarity} · {pattern.pattern_id}</option>)}</select></label>
      <div className="form-pair">
        <label>表示ラベル（任意）<input maxLength={200} value={draft.label ?? ''} onChange={(event) => setDraft({ ...draft, label: event.target.value })} placeholder="例：普段使いの護石" /></label>
        <label>レア度<input type="number" min="1" step="1" value={draft.rarity} onChange={(event) => setDraft({ ...draft, rarity: Number(event.target.value) })} /></label>
      </div>
      <fieldset><legend>スキル</legend>
        {draft.skills.map((skill, index) => <div className="ability-row" key={index}>
          <label>スキル {index + 1}<select value={skill.skill_id} onChange={(event) => setDraft({ ...draft, skills: draft.skills.map((entry, itemIndex) => itemIndex === index ? { ...entry, skill_id: event.target.value } : entry) })}>
            {!skills.some((entry) => entry.skill_id === skill.skill_id) && <option value={skill.skill_id}>{skill.skill_id || 'スキルを選択'}</option>}
            {skills.map((entry) => <option key={entry.skill_id} value={entry.skill_id}>{itemName(entry.display_name, entry.skill_id)}</option>)}
          </select></label>
          <label>レベル {index + 1}<input type="number" min="1" step="1" value={skill.level} onChange={(event) => setDraft({ ...draft, skills: draft.skills.map((entry, itemIndex) => itemIndex === index ? { ...entry, level: Number(event.target.value) } : entry) })} /></label>
          <button type="button" aria-label={`スキル ${index + 1} を削除`} onClick={() => setDraft({ ...draft, skills: draft.skills.filter((_, itemIndex) => itemIndex !== index) })}>削除</button>
        </div>)}
        <button type="button" className="text-button" onClick={() => setDraft({ ...draft, skills: [...draft.skills, { skill_id: skills[0]?.skill_id ?? '', level: 1 }] })}>＋ スキルを追加</button>
      </fieldset>
      <fieldset><legend>スロット（ゲーム内の表示順）</legend>
        {!draft.slots.length && <p className="muted">スロットなし</p>}
        {draft.slots.map((slot, index) => <div className="ability-row" key={index}>
          <label>スロット {index + 1} の種類<select value={slot.kind} onChange={(event) => setDraft({ ...draft, slots: draft.slots.map((entry, itemIndex) => itemIndex === index ? { ...entry, kind: event.target.value as Slot['kind'] } : entry) })}><option value="weapon">武器</option><option value="armor">防具</option></select></label>
          <label>スロット {index + 1} のレベル<select value={slot.level} onChange={(event) => setDraft({ ...draft, slots: draft.slots.map((entry, itemIndex) => itemIndex === index ? { ...entry, level: Number(event.target.value) } : entry) })}>{![1, 2, 3].includes(slot.level) && <option value={slot.level}>{slot.level}（現在の値）</option>}{[1, 2, 3].map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
          <button type="button" aria-label={`スロット ${index + 1} を削除`} onClick={() => setDraft({ ...draft, slots: draft.slots.filter((_, itemIndex) => itemIndex !== index) })}>削除</button>
        </div>)}
        <button type="button" className="text-button" onClick={() => setDraft({ ...draft, slots: [...draft.slots, { kind: 'armor', level: 1 }] })}>＋ スロットを追加</button>
      </fieldset>
      <label>所持数<input type="text" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} aria-invalid={!quantityValid} aria-describedby={!quantityValid ? 'charm-quantity-error' : undefined} /></label>
      {!quantityValid && <p className="field-error" id="charm-quantity-error">1以上の安全な整数を入力してください。</p>}
      <div className={`notice ${validation.status === 'valid' ? 'success' : 'warning'}`} role="status">
        <strong>{validation.status === 'valid' ? '登録可能な能力です' : validation.status === 'unverifiable' ? '現在のカタログでは検証できません' : '能力の組合せを確認してください'}</strong>
        {validation.issues.length > 0 && <ul>{validation.issues.map((issue) => <li key={issue}>{issue.startsWith('ValidationError:') ? 'スキルの重複や未入力、レベル・レア度・スロットの数値を確認してください。' : issue}</li>)}</ul>}
        {validation.matching_pattern_ids.length > 1 && <p>{validation.matching_pattern_ids.length}件のパターンに一致しています。複数一致も登録できます。</p>}
      </div>
      <div className="dialog-actions"><button type="button" onClick={onClose}>キャンセル</button><button type="submit" className="primary" disabled={validation.status !== 'valid' || !quantityValid || stale}>この護石を保存</button></div>
    </form>
  </Modal>
}
