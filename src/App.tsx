import { useEffect, useMemo, useState } from 'react'
import { backupFilename, createProfile, exportProfile, inspectProfile, MAX_PROFILE_BYTES, previewImport, validateAppraisalCharm } from './domain'
import { createCatalogLoader } from './catalog'
import { serviceRoutes } from './routes'
import { createInventoryStore } from './storage'
import type { AppraisalCharm, CheckerCatalog } from './domain'
import { AppraisalEditor } from './components/AppraisalEditor'
import { Modal } from './components/Modal'
import { QuantityEditor } from './components/QuantityEditor'
import { downloadText } from './ui/download'
import { changeQuantity, emptyFilters, filterAppraisals, filterDecorations, filterFixedCharms, inventorySummary, itemName, orphanDescriptions, quantityFor, skillText, slotText } from './ui/selectors'
import type { Filters, InventoryKind } from './ui/selectors'
import { useInventory } from './ui/useInventory'
import type { InventoryStore } from './ui/useInventory'
import { LocaleProvider } from './i18n/LocaleProvider'
import { useLocale } from './i18n/context'
import { loadEnglishNames, localizeCatalog } from './i18n/names'
import type { EnglishNames } from './i18n/names'
import { localizedProfileWarnings } from './i18n/warnings'

type CatalogLoader = ReturnType<typeof createCatalogLoader>
type ImportPreview = ReturnType<typeof previewImport>
type DialogState = { kind: 'appraisal'; title: string; value: AppraisalCharm; editingId?: string; revision: number } | { kind: 'delete'; value: AppraisalCharm; revision: number } | { kind: 'reset' | 'reload'; revision: number } | { kind: 'import'; preview: ImportPreview; revision: number }

function FilterBar({ category, filters, onChange }: { category: 'decorations' | 'fixed_charms'; filters: Filters; onChange: (filters: Filters) => void }) {
  const { t } = useLocale()
  return <div className="filter-bar">
    <label className="search-field">{t("名称・ID・スキルで検索")}<input type="search" placeholder={t("例：攻撃、達人、スキル名")} value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} /></label>
    <label>{t("所持状態")}<select value={filters.ownership} onChange={(event) => onChange({ ...filters, ownership: event.target.value as Filters['ownership'] })}><option value="all">{t("すべて")}</option><option value="owned">{t("所持")}</option><option value="missing">{t("未所持")}</option></select></label>
    <label>{category === 'decorations' ? t("装飾品の種類") : t("スロット")}<select value={filters.kind} onChange={(event) => onChange({ ...filters, kind: event.target.value })}><option value="">{t("すべて")}</option>{category === 'decorations' ? <><option value="weapon">{t("武器")}</option><option value="armor">{t("防具")}</option></> : <><option value="with">{t("スロットあり")}</option><option value="without">{t("スロットなし")}</option></>}</select></label>
    {category === 'decorations' && <label>{t("スロットレベル")}<select value={filters.level} onChange={(event) => onChange({ ...filters, level: event.target.value })}><option value="">{t("すべて")}</option>{[1, 2, 3].map((level) => <option key={level} value={level}>{level}</option>)}</select></label>}
  </div>
}

type AppProps = { store?: InventoryStore; catalogLoader?: CatalogLoader; namesLoader?: typeof loadEnglishNames }
export function App(props: AppProps = {}) { return <LocaleProvider><InventoryApp {...props} /></LocaleProvider> }
function InventoryApp({ store: providedStore, catalogLoader: providedLoader, namesLoader = loadEnglishNames }: AppProps) {
  const { locale, setLocale, t } = useLocale()
  const [englishNames, setEnglishNames] = useState<EnglishNames | null>(null)
  const [namesUnavailable, setNamesUnavailable] = useState(false)
  const [store] = useState(() => providedStore ?? createInventoryStore())
  const [loader] = useState(() => providedLoader ?? createCatalogLoader())
  const routes = serviceRoutes()
  const [catalogResult, setCatalogResult] = useState<Awaited<ReturnType<CatalogLoader['load']>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadCatalog, setReloadCatalog] = useState(0)
  const inventory = useInventory(store)
  const originalCatalog = catalogResult?.catalog ?? null
  const englishCatalog = useMemo(() => originalCatalog ? localizeCatalog(originalCatalog, englishNames) : null, [originalCatalog, englishNames])
  const catalog = locale === 'en' ? englishCatalog : originalCatalog
  const alternateCatalog = locale === 'en' ? originalCatalog : englishCatalog
  const emptyProfile = useMemo(() => createProfile(catalog?.revision ?? null), [catalog?.revision])
  const profile = inventory.profile ?? emptyProfile
  const [category, setCategory] = useState<InventoryKind>('decorations')
  const [decorationFilters, setDecorationFilters] = useState<Filters>(emptyFilters)
  const [fixedFilters, setFixedFilters] = useState<Filters>(emptyFilters)
  const [appraisalQuery, setAppraisalQuery] = useState('')
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const importWarnings = useMemo(() => dialog?.kind === 'import' && catalog ? localizedProfileWarnings(dialog.preview.imported, catalog, locale) : [], [catalog, dialog, locale])
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [importError, setImportError] = useState('')
  const [readingFile, setReadingFile] = useState(false)
  const [actionError, setActionError] = useState('')
  const editable = Boolean(catalog) && inventory.loaded.status !== 'corrupt' && inventory.loaded.status !== 'unavailable' && !['unsaved', 'conflict'].includes(inventory.saveState)
  const summary = catalog ? inventorySummary(catalog, profile) : null
  const orphans = catalog ? orphanDescriptions(catalog, profile) : []
  const appraisalIssues = catalog ? inspectProfile(profile, catalog).appraisal_charms : []
  useEffect(() => {
    const abort = new AbortController()
    void loader.load(abort.signal).then((result) => {
      if (abort.signal.aborted) return
      setCatalogResult(result)
      setLoading(false)
    }).catch(() => {
      if (abort.signal.aborted) return
      setCatalogResult({ status: 'error', catalog: null, error: 'カタログの読込みに失敗しました。' })
      setLoading(false)
    })
    return () => abort.abort()
  }, [loader, reloadCatalog])
  useEffect(() => {
    if (locale !== 'en' || englishNames) return
    const abort = new AbortController()
    const timeout = setTimeout(() => { abort.abort(); setNamesUnavailable(true) }, 15_000)
    void namesLoader(abort.signal).then((names) => { if (!abort.signal.aborted) { setEnglishNames(names); setNamesUnavailable(false) } }).catch(() => { if (!abort.signal.aborted) setNamesUnavailable(true) })
    return () => { clearTimeout(timeout); abort.abort() }
  }, [locale, englishNames, namesLoader])

  function updateQuantity(kind: 'decorations' | 'fixed_charms', id: string, value: number, delta = false, expectedRevision?: number) {
    return inventory.update((current) => {
      const base = current ?? emptyProfile
      return changeQuantity(base, kind, id, delta ? quantityFor(base, kind, id) + value : value)
    }, expectedRevision)
  }
  function openAppraisal(value?: AppraisalCharm, clone = false) {
    const firstPattern = catalog?.appraisal_charm_patterns[0]
    const initial: AppraisalCharm = value ? { ...value, instance_id: clone ? crypto.randomUUID() : value.instance_id, skills: value.skills.map((skill) => ({ ...skill })), slots: value.slots.map((slot) => ({ ...slot })) } : { instance_id: crypto.randomUUID(), rarity: firstPattern?.rarity ?? 1, skills: [], slots: [], quantity: 1 }
    setDialog({ kind: 'appraisal', title: value ? clone ? t("鑑定護石を複製") : t("鑑定護石を編集") : t("鑑定護石を登録"), value: initial, editingId: value && !clone ? value.instance_id : undefined, revision: inventory.revision })
  }
  function saveAppraisal(value: AppraisalCharm) {
    if (dialog?.kind !== 'appraisal') return
    if (profile.appraisal_charms.some((entry) => entry.instance_id === value.instance_id && entry.instance_id !== dialog.editingId)) { setActionError(t("個体IDが重複しています。画面を閉じて、再度登録してください。")); return }
    const accepted = inventory.update((current) => ({ ...(current ?? emptyProfile), appraisal_charms: [...(current ?? emptyProfile).appraisal_charms.filter((entry) => entry.instance_id !== dialog.editingId), value] }), dialog.revision)
    if (accepted) setDialog(null)
  }
  async function readBackup(file: File) {
    setImportError('')
    if (file.size > MAX_PROFILE_BYTES) { setImportError(t("ファイルが大きすぎます。{0} MiB 以下のJSONを選択してください。", MAX_PROFILE_BYTES / 1024 / 1024)); return }
    const revision = inventory.revision
    setReadingFile(true)
    try {
      if (!catalog) throw new Error(t("カタログを読み込んでから取り込んでください。"))
      const preview = previewImport(await file.text(), profile, catalog)
      setImportMode('merge')
      setDialog({ kind: 'import', preview, revision })
    } catch (error) { setImportError(error instanceof Error ? error.message : t("JSONを読み込めませんでした。")) }
    finally { setReadingFile(false) }
  }
  function exportBackup() { downloadText(exportProfile(profile), backupFilename(profile)) }

  return <>
    <a className="skip-link" href="#inventory-content">{t("所持品の入力へ移動")}</a>
    <header className="site-header"><a className="brand" href={routes.checker} aria-label={t("MHWILDS 所持品チェッカー ホーム")}><span aria-hidden="true" className="brand-mark">◇</span><span>MHWILDS<small>INVENTORY CHECKER</small></span></a><label className="language-select">言語 / Language<select value={locale} onChange={(event) => setLocale(event.target.value === 'en' ? 'en' : 'ja')}><option value="ja" lang="ja">日本語</option><option value="en" lang="en">English</option></select></label><a className="sim-link" href={routes.simulator}>{t("スキルシミュレーター ")}<span aria-hidden="true">↗</span></a></header>
    <main className="page-shell">{locale === 'en' && namesUnavailable && <p className="notice warning" role="status">{t("翻訳名を読み込めませんでした。元の名前を表示しています。")}</p>}
      <section className="hero" aria-labelledby="page-title"><div><p className="eyebrow">MY EQUIPMENT COLLECTION</p><h1 id="page-title">{t("所持品チェッカー")}</h1><p className="lead">{t("手持ちを整えて、装備探しをもっと身近に。")}</p><p className="muted">{t("装飾品と護石を登録すると、同じブラウザのスキルシミュレーターで所持情報を利用できます。")}</p></div><div className="save-status" role="status"><span className={`status-dot ${inventory.saveState === 'saved' ? '' : 'attention'}`} aria-hidden="true" />{inventory.saveState === 'saving' ? t("保存中…") : inventory.saveState === 'conflict' ? t("保存競合・未保存") : inventory.saveState === 'unsaved' ? t("未保存の変更あり") : inventory.loaded.status === 'corrupt' ? t("保存データを確認してください") : inventory.loaded.status === 'unavailable' ? t("保存領域を利用できません") : inventory.profile ? t("このブラウザに保存済み") : t("まだ登録されていません")}</div></section>
      {inventory.error && <div className="notice warning" role="alert"><p>{t(inventory.error)}</p><button onClick={() => setDialog({ kind: 'reload', revision: inventory.revision })} disabled={inventory.saveState === 'saving'}>{t("最新の保存データを読み込む")}</button></div>}
      {inventory.loaded.status === 'corrupt' && <div className="notice error" role="alert"><strong>{t("保存データを読み込めません。元のデータは保持されています。")}</strong><p>{t("破損または未対応の形式です。下のバックアップ欄で元データを退避し、JSONの復元または明示的な初期化を行ってください。")}</p></div>}
      {inventory.loaded.status === 'unavailable' && <p className="notice error" role="alert">{t("このブラウザでは保存領域を利用できません。ブラウザのプライバシー設定を確認してください。")}</p>}
      {catalogResult?.status === 'stale' && <p className="notice warning" role="alert">{t("カタログの更新に失敗しました。前回正常に取得したデータを表示しています。再読込みで更新を試せます。")}</p>}
      {catalog && inventory.profile && profile.catalog_revision !== catalog.revision && <div className="notice warning"><p>{t("保存時と現在のカタログの版が異なります。現在のカタログにない所持品は削除せず保持しています。内容を確認して参照版を更新すると、現在の検索に利用できます。")}</p><button disabled={!editable} onClick={() => inventory.update((current) => ({ ...(current ?? emptyProfile), catalog_revision: catalog.revision }))}>{t("カタログ参照を更新")}</button></div>}
      {orphans.length > 0 && <details className="notice warning"><summary>{t("現在のカタログにない所持品 {0}種類を保持しています", orphans.length)}</summary><p>{t("現在の検索では利用できません。JSONバックアップには含まれます。")}</p><ul>{orphans.map((orphan) => <li key={orphan}>{t(orphan)}</li>)}</ul></details>}
      {appraisalIssues.length > 0 && <details className="notice warning"><summary>{t("現在のルールで利用できない鑑定護石 {0}個体を保持しています", appraisalIssues.length)}</summary><ul>{appraisalIssues.map((entry) => <li key={entry.instance_id}>{entry.instance_id}：{entry.validation.status === 'unverifiable' ? t("検証不能") : t("能力不一致")} — {entry.validation.issues.map((issue) => t(issue)).join(' ')}</li>)}</ul><p>{t("登録内容は保持され、JSONバックアップに含まれます。")}</p></details>}
      <section className="summary-grid" aria-label={t("所持品の概要")}>
        <Summary name={t("装飾品")} owned={summary?.decorations} total={catalog?.decorations.length} quantity={summary?.decorationTotal} />
        <Summary name={t("固定護石")} owned={summary?.fixed} total={catalog?.fixed_charms.length} quantity={summary?.fixedTotal} />
        <article className="summary-card"><p>{t("鑑定護石")}</p><div className="summary-value">{profile.appraisal_charms.length}<span>{t("個体")}</span></div><p className="muted">{t("合計 ")}{summary?.appraisalTotal ?? '—'}{t(" 個 · 個体ごとに管理")}</p><div className="summary-rule">{t("能力の組合せを登録")}</div></article>
      </section>
      <section className="inventory-panel" id="inventory-content" aria-labelledby="inventory-title">
        <div className="panel-header"><div><p className="section-kicker">YOUR INVENTORY</p><h2 id="inventory-title">{t("所持品を登録")}</h2></div><p className="muted">{t("変更は自動保存されます")}</p></div>
        <nav className="category-nav" aria-label={t("所持品カテゴリ")}>{([['decorations', t("装飾品")], ['fixed_charms', t("固定護石")], ['appraisal_charms', t("鑑定護石")]] as const).map(([key, label]) => <button key={key} aria-current={category === key ? 'page' : undefined} onClick={() => setCategory(key)}>{label}</button>)}</nav>
        {loading ? <p className="empty-state" role="status">{t("実カタログを読み込んでいます…")}</p> : !catalog ? <div className="empty-state"><h3>{t("カタログを取得できませんでした")}</h3><p>{t("通信状態を確認して再試行してください。保存済みの所持情報は変更していません。")}</p><button className="primary" onClick={() => { setLoading(true); setReloadCatalog((value) => value + 1) }}>{t("カタログを再読込み")}</button></div> : <>
          {category === 'decorations' && <><FilterBar category="decorations" filters={decorationFilters} onChange={setDecorationFilters} /><div className="list-meta"><h3>{t("装飾品")}</h3><span>{filterDecorations(catalog, profile, decorationFilters, alternateCatalog).length} / {catalog.decorations.length}{t(" 種類")}</span></div><div className="item-list">{filterDecorations(catalog, profile, decorationFilters, alternateCatalog).map((item) => <article className="inventory-row" key={item.decoration_id}><div className={`item-symbol ${item.required_slot.kind}`} aria-hidden="true">◇</div><div className="item-details"><h4>{itemName(item.display_name, item.decoration_id)}</h4><p className="item-skills">{skillText(item.skills, catalog)}</p><div className="item-meta"><span className="badge">{slotText([item.required_slot], locale)}</span><span className="item-id">{item.decoration_id}</span></div></div><QuantityEditor name={itemName(item.display_name, item.decoration_id)} value={quantityFor(profile, category, item.decoration_id)} revision={inventory.revision} disabled={!editable} onChange={(value, revision) => updateQuantity(category, item.decoration_id, value, false, revision)} onAdjust={(value) => updateQuantity(category, item.decoration_id, value, true)} /></article>)}</div>{!filterDecorations(catalog, profile, decorationFilters, alternateCatalog).length && <p className="empty-state">{t("条件に一致する装飾品はありません。検索語や絞り込みを変更してください。")}</p>}</>}
          {category === 'fixed_charms' && <><FilterBar category="fixed_charms" filters={fixedFilters} onChange={setFixedFilters} /><div className="list-meta"><h3>{t("固定護石")}</h3><span>{filterFixedCharms(catalog, profile, fixedFilters, alternateCatalog).length} / {catalog.fixed_charms.length}{t(" 種類")}</span></div><div className="item-list">{filterFixedCharms(catalog, profile, fixedFilters, alternateCatalog).map((item) => <article className="inventory-row" key={item.equipment_id}><div className="item-symbol charm" aria-hidden="true">♢</div><div className="item-details"><h4>{itemName(item.display_name, item.equipment_id)}</h4><p className="item-skills">{skillText(item.skills, catalog)}</p><div className="item-meta"><span className="badge">{slotText(item.slots, locale)}</span><span className="item-id">{item.equipment_id}</span></div></div><QuantityEditor name={itemName(item.display_name, item.equipment_id)} value={quantityFor(profile, category, item.equipment_id)} revision={inventory.revision} disabled={!editable} onChange={(value, revision) => updateQuantity(category, item.equipment_id, value, false, revision)} onAdjust={(value) => updateQuantity(category, item.equipment_id, value, true)} /></article>)}</div>{!filterFixedCharms(catalog, profile, fixedFilters, alternateCatalog).length && <p className="empty-state">{t("条件に一致する固定護石はありません。")}</p>}</>}
          {category === 'appraisal_charms' && <><div className="filter-bar"><label className="search-field">{t("鑑定護石を検索")}<input type="search" value={appraisalQuery} placeholder={t("ラベル・個体ID・スキル名")} onChange={(event) => setAppraisalQuery(event.target.value)} /></label><button className="primary" disabled={!editable} onClick={() => openAppraisal()}>{t("＋ 鑑定護石を登録")}</button></div><div className="list-meta"><h3>{t("鑑定護石")}</h3><span>{filterAppraisals(catalog, profile, appraisalQuery, alternateCatalog).length}{t(" 個体")}</span></div><div className="item-list">{filterAppraisals(catalog, profile, appraisalQuery, alternateCatalog).map((item) => <AppraisalRow key={item.instance_id} item={item} catalog={catalog} disabled={!editable} onEdit={() => openAppraisal(item)} onClone={() => openAppraisal(item, true)} onDelete={() => setDialog({ kind: 'delete', value: item, revision: inventory.revision })} />)}</div>{!filterAppraisals(catalog, profile, appraisalQuery, alternateCatalog).length && <p className="empty-state">{profile.appraisal_charms.length ? t("条件に一致する鑑定護石はありません。") : t("鑑定護石はまだ登録されていません。ゲーム内で確認した能力を登録してください。")}</p>}</>}
        </>}
      </section>
      <section className="backup-panel" aria-labelledby="backup-title"><div><p className="section-kicker">BACKUP & RESTORE</p><h2 id="backup-title">{t("大切な所持情報をバックアップ")}</h2><p className="muted">{t("データは端末・ブラウザ・サイトの保存領域ごとに管理されます。ブラウザのデータ削除や端末変更に備え、定期的にJSONを保存してください。所持品の編集とJSON処理はブラウザ内で完結します。")}</p></div><div className="backup-actions"><button className="primary" onClick={exportBackup} disabled={!inventory.profile}>{t("JSONをダウンロード")}</button><label className={`file-button ${!catalog || readingFile || inventory.saveState === 'saving' ? 'disabled' : ''}`}>{t("JSONから復元")}<input type="file" accept="application/json,.json" aria-label={t("復元するJSONファイル")} disabled={!catalog || readingFile || inventory.saveState === 'saving'} onChange={(event) => { const file = event.target.files?.[0]; if (file) void readBackup(file); event.target.value = '' }} /></label>{inventory.loaded.status === 'corrupt' && inventory.loaded.raw !== null && <button onClick={() => downloadText(inventory.loaded.raw ?? '', `mhwilds-inventory-recovery-${new Date().toISOString().replaceAll(':', '-')}.json`)}>{t("元の保存データを退避")}</button>}<button className="text-button danger" disabled={inventory.saveState === 'saving' || inventory.loaded.status === 'unavailable' || !catalog} onClick={() => setDialog({ kind: 'reset', revision: inventory.revision })}>{t("所持情報を初期化")}</button></div>{readingFile && <p role="status">{t("バックアップを検証しています…")}</p>}{importError && <p className="notice error" role="alert">{t(importError)}</p>}</section>
      <details className="help-panel"><summary>{t("使い方・保存・連携について")}</summary><ol><li>{t("装飾品・固定護石の数量を入力します。0個は未所持です。固定護石も複数個の情報を保持します。")}</li><li>{t("鑑定護石はスキル名を選び、レベル・スロット・レア度を入力します。現在のルールに一致した個体を保存できます。")}</li><li>{t("上部のスキルシミュレーターへ移動し、「所持品を考慮する」を選ぶと、同じブラウザ内の所持情報を検索条件に利用します。")}</li><li>{t("カタログにないIDや検証できない護石は保存したまま警告します。現在の検索に適用できない場合があります。")}</li></ol><p>{t("JSONの統合は同じIDの所持数を加算せず、大きい方を採用します。同じ鑑定護石IDで能力が異なる場合は統合を中止します。別の個体IDは同じ能力でも別個体として扱います。")}</p><p>{t("保存競合やエラー時は未保存の内容をJSONで退避し、最新の保存データを読み込んでから統合してください。通常のJSONダウンロードに破損した元データは含まれません。")}</p></details>
      <footer className="page-footer"><span>{t("MHWILDS 所持品チェッカー")}</span><details><summary>{t("カタログ・保存情報")}</summary><dl><dt>{t("カタログ版")}</dt><dd>{catalog?.revision ?? t("未取得")}</dd><dt>{t("生成日時")}</dt><dd>{catalog?.generated_at ?? '—'}</dd><dt>{t("保存形式")}</dt><dd>InventoryProfile v1</dd><dt>{t("プロフィールID")}</dt><dd>{inventory.profile?.profile_id ?? t("未登録")}</dd><dt>{t("最終更新")}</dt><dd>{inventory.profile?.updated_at ?? '—'}</dd></dl><button onClick={() => { setLoading(true); setReloadCatalog((value) => value + 1) }}>{t("カタログを再読込み")}</button></details></footer>
    </main>
    {actionError && <p className="notice error" role="alert">{t(actionError)}</p>}
    {dialog?.kind === 'appraisal' && catalog && <AppraisalEditor title={dialog.title} initial={dialog.value} catalog={catalog} stale={dialog.revision !== inventory.revision} onClose={() => { setDialog(null); setActionError('') }} onSave={saveAppraisal} />}
    {dialog?.kind === 'delete' && <Modal title={t("鑑定護石を削除")} onClose={() => setDialog(null)}><p>{t("「{0}」（{1}個）を削除します。", dialog.value.label || dialog.value.instance_id, dialog.value.quantity)}</p><p>{t("この操作は元に戻せません。必要に応じて先にJSONをダウンロードしてください。")}</p><div className="dialog-actions"><button autoFocus onClick={() => setDialog(null)}>{t("キャンセル")}</button><button className="danger-button" disabled={dialog.revision !== inventory.revision} onClick={() => { if (inventory.update((current) => ({ ...(current ?? emptyProfile), appraisal_charms: (current ?? emptyProfile).appraisal_charms.filter((item) => item.instance_id !== dialog.value.instance_id) }), dialog.revision)) setDialog(null) }}>{t("この鑑定護石を削除")}</button></div></Modal>}
    {dialog?.kind === 'reset' && <Modal title={t("所持情報を初期化")} onClose={() => setDialog(null)}><p>{t("装飾品 {0}種類、固定護石 {1}種類、鑑定護石 {2}個体の登録を削除します。", profile.decorations.length, profile.fixed_charms.length, profile.appraisal_charms.length)}</p><p>{t("先にJSONをダウンロードしてください。破損した元データは復旧用に保持されます。")}</p><div className="dialog-actions"><button autoFocus onClick={() => setDialog(null)}>{t("キャンセル")}</button><button disabled={!inventory.profile} onClick={exportBackup}>{t("JSONを退避")}</button><button className="danger-button" disabled={dialog.revision !== inventory.revision || ['unsaved', 'conflict'].includes(inventory.saveState)} onClick={() => { if (inventory.update((current) => ({ ...(current ?? emptyProfile), catalog_revision: catalog?.revision ?? null, decorations: [], fixed_charms: [], appraisal_charms: [] }), dialog.revision, inventory.loaded.status === 'corrupt')) setDialog(null) }}>{t("登録をすべて初期化")}</button></div></Modal>}
    {dialog?.kind === 'reload' && <Modal title={t("最新の保存データを読込み")} onClose={() => setDialog(null)}><p>{t("この画面にある未保存の変更は失われます。先にJSONへ退避してから読み込んでください。")}</p><div className="dialog-actions"><button autoFocus onClick={() => setDialog(null)}>{t("キャンセル")}</button><button disabled={!inventory.profile} onClick={exportBackup}>{t("JSONを退避")}</button><button className="primary" onClick={() => { inventory.reload(); setDialog(null) }}>{t("保存データを読み込む")}</button></div></Modal>}
    {dialog?.kind === 'import' && <Modal title={t("バックアップの取込確認")} onClose={() => setDialog(null)}><p>{t("バックアップの更新日時：")}{dialog.preview.imported.updated_at}</p><dl className="preview-counts"><dt>{t("装飾品")}</dt><dd>{dialog.preview.counts.decorations}{t("種類")}</dd><dt>{t("固定護石")}</dt><dd>{dialog.preview.counts.fixed_charms}{t("種類")}</dd><dt>{t("鑑定護石")}</dt><dd>{dialog.preview.counts.appraisal_charms}{t("個体")}</dd></dl><fieldset><legend>{t("取込方法を選択")}</legend><label className="radio-label"><input type="radio" name="import-mode" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} />{t("現在の所持情報と統合")}</label><p className="muted">{t("同じIDは所持数の大きい方を採用します。加算しません。")}</p><label className="radio-label"><input type="radio" name="import-mode" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} />{t("バックアップで全体を置換")}</label><p className="muted">{t("現在の登録内容をバックアップの内容に入れ替えます。")}</p></fieldset><p>{t("変更対象：")}{dialog.preview.changes[importMode]}{t("件")}</p>{importWarnings.length > 0 && <ul className="notice warning">{importWarnings.map((warning) => <li key={warning}>{t(warning)}</li>)}</ul>}{dialog.preview.conflicts.length > 0 && <div className="notice error"><strong>{t("個体IDの能力が衝突しているため統合できません。")}</strong><ul>{dialog.preview.conflicts.map((conflict) => <li key={conflict}>{conflict}</li>)}</ul></div>}{dialog.revision !== inventory.revision && <p className="notice error" role="alert">{t("プレビュー後に所持情報が更新されました。閉じてJSONを読み込み直してください。")}</p>}{inventory.loaded.status === 'corrupt' && <p className="notice warning">{t("破損した保存データを復旧用に保持して、このバックアップから復元します。")}</p>}<div className="dialog-actions"><button autoFocus onClick={() => setDialog(null)}>{t("キャンセル")}</button><button className="primary" disabled={dialog.revision !== inventory.revision || (importMode === 'merge' && !dialog.preview.merge) || ['unsaved', 'conflict'].includes(inventory.saveState)} onClick={() => { const next = dialog.preview[importMode]; if (next && inventory.update(() => next, dialog.revision, inventory.loaded.status === 'corrupt')) setDialog(null) }}>{importMode === 'merge' ? t("統合して保存") : t("全体を置換して保存")}</button></div></Modal>}
  </>
}

function Summary({ name, owned, total, quantity }: { name: string; owned?: number; total?: number; quantity?: string }) {
  const { t } = useLocale()
  return <article className="summary-card"><p>{name}</p><div className="summary-value">{owned ?? '—'}<span>/ {total ?? '—'}{t(" 種類")}</span></div><p className="muted">{t("未所持 ")}{total !== undefined && owned !== undefined ? total - owned : '—'}{t("種類 · 合計 ")}{quantity ?? '—'}{t("個")}</p><progress aria-label={t("{0}の所持種類", name)} value={owned ?? 0} max={total || 1} /></article>
}
function AppraisalRow({ item, catalog, disabled, onEdit, onClone, onDelete }: { item: AppraisalCharm; catalog: CheckerCatalog; disabled: boolean; onEdit: () => void; onClone: () => void; onDelete: () => void }) {
  const { locale, t } = useLocale()
  const validation = validateAppraisalCharm(item, catalog)
  const name = item.label || item.instance_id
  return <article className="inventory-row appraisal-row"><div className="item-symbol appraisal" aria-hidden="true">✧</div><div className="item-details"><h4>{name}</h4><p className="item-skills">{skillText(item.skills, catalog)}</p><div className="item-meta"><span className="badge">RARE {item.rarity}</span><span className="badge">{slotText(item.slots, locale)}</span><span>{item.quantity}{t("個")}</span></div>{validation.status !== 'valid' && <p className="field-error">{validation.status === 'unverifiable' ? t("検証不能：現在の検索に適用できません。登録内容は保持しています。") : t("能力不一致：現在のルールでは検索に適用できません。")}</p>}<span className="item-id">{item.instance_id}</span></div><div className="row-actions"><button disabled={disabled} aria-label={t("{0}を編集", name)} onClick={onEdit}>{t("編集")}</button><button disabled={disabled} aria-label={t("{0}を複製", name)} onClick={onClone}>{t("複製")}</button><button disabled={disabled} className="text-button danger" aria-label={t("{0}を削除", name)} onClick={onDelete}>{t("削除")}</button></div></article>
}
