// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { translate } from './messages'

describe('localized status messages', () => {
  it('translates dynamic quantity errors in both directions after switching language', () => {
    const ja = '編集中に保存内容が更新されました。入力中の値は未保存です。最新の保存値は12個です。確認してから入力し直してください。'
    const en = translate('en', ja)
    expect(en).toContain('latest saved quantity is 12')
    expect(translate('ja', en)).toBe(ja)
  })
  it('translates validation and import warnings while preserving paths and stable IDs', () => {
    expect(translate('ja', '$.decorations[0].quantity: safe integer >= 0 required')).toBe('$.decorations[0].quantity: 0以上の安全な整数が必要です')
    expect(translate('en', '未解決の装飾品を保持: decoration:123')).toBe('Preserving an unresolved decoration: decoration:123')
    expect(translate('en', '鑑定護石 instance:456: スキルの種別またはレベルが不正です。')).toBe('Appraisal charm instance:456: The skill type or level is invalid.')
  })
  it('inserts names verbatim without interpreting user text as markup or language keys', () => {
    expect(translate('en', '{0}を編集', '<label>閉じる</label>')).toBe('Edit <label>閉じる</label>')
  })
})
