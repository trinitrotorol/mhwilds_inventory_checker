import type { Locale } from './locale'

export const english: Record<string, string> = {
  '名称・ID・スキルで検索': 'Search by name, ID or skill',
  '例：攻撃、達人、スキル名': 'Example: Attack, Expert or a skill name',
  '所持状態': 'Ownership', 'すべて': 'All', '所持': 'Owned', '未所持': 'Not owned',
  '装飾品の種類': 'Decoration type', 'スロット': 'Slots', '武器': 'Weapon', '防具': 'Armor',
  'スロットあり': 'With slots', 'スロットなし': 'No slots', 'スロットレベル': 'Slot level',
  'カタログの読込みに失敗しました。': 'Could not load the catalog.',
  '鑑定護石を複製': 'Duplicate appraisal charm', '鑑定護石を編集': 'Edit appraisal charm', '鑑定護石を登録': 'Add appraisal charm',
  '個体IDが重複しています。画面を閉じて、再度登録してください。': 'This instance ID already exists. Close this dialog and add the charm again.',
  'ファイルが大きすぎます。{0} MiB 以下のJSONを選択してください。': 'The file is too large. Select a JSON file no larger than {0} MiB.',
  'カタログを読み込んでから取り込んでください。': 'Load the catalog before importing a backup.',
  'JSONを読み込めませんでした。': 'Could not read the JSON file.',
  '所持品の入力へ移動': 'Skip to inventory', 'MHWILDS 所持品チェッカー ホーム': 'MHWILDS Inventory Checker home',
  'スキルシミュレーター ': 'Skill Simulator ', '所持品チェッカー': 'Inventory Checker',
  '手持ちを整えて、装備探しをもっと身近に。': 'Organize your inventory and find your next build.',
  '装飾品と護石を登録すると、同じブラウザのスキルシミュレーターで所持情報を利用できます。': 'Register your decorations and charms to use them in the Skill Simulator in this browser.',
  '保存中…': 'Saving…', '保存競合・未保存': 'Save conflict · Not saved', '未保存の変更あり': 'Unsaved changes',
  '保存データを確認してください': 'Check your saved data', '保存領域を利用できません': 'Storage unavailable',
  'このブラウザに保存済み': 'Saved in this browser', 'まだ登録されていません': 'No inventory saved yet',
  '最新の保存データを読み込む': 'Load the latest saved data',
  '保存データを読み込めません。元のデータは保持されています。': 'Cannot read the saved data. The original data has been preserved.',
  '破損または未対応の形式です。下のバックアップ欄で元データを退避し、JSONの復元または明示的な初期化を行ってください。': 'The data is damaged or uses an unsupported format. Export the original data below before restoring a JSON backup or resetting your inventory.',
  'このブラウザでは保存領域を利用できません。ブラウザのプライバシー設定を確認してください。': 'Storage is unavailable in this browser. Check your browser privacy settings.',
  'カタログの更新に失敗しました。前回正常に取得したデータを表示しています。再読込みで更新を試せます。': 'The catalog update failed. The last successfully loaded catalog is shown. Reload to try again.',
  '保存時と現在のカタログの版が異なります。現在のカタログにない所持品は削除せず保持しています。内容を確認して参照版を更新すると、現在の検索に利用できます。': 'Your inventory references an older catalog. Items missing from the current catalog are preserved. Review your inventory and update its catalog reference before searching.',
  'カタログ参照を更新': 'Update catalog reference',
  '現在のカタログにない所持品 {0}種類を保持しています': 'Preserving {0} item types missing from the current catalog',
  '現在の検索では利用できません。JSONバックアップには含まれます。': 'These items cannot be used in the current search. They remain in JSON backups.',
  '現在のルールで利用できない鑑定護石 {0}個体を保持しています': 'Preserving {0} appraisal charms that cannot be used with the current rules',
  '検証不能': 'Unverifiable', '能力不一致': 'Abilities do not match',
  '登録内容は保持され、JSONバックアップに含まれます。': 'Your entries are preserved and included in JSON backups.',
  '所持品の概要': 'Inventory summary', '装飾品': 'Decorations', '固定護石': 'Crafted charms', '鑑定護石': 'Appraisal charms',
  '個体': ' instances', '合計 ': 'Total ', ' 個 · 個体ごとに管理': ' · Tracked by instance', '能力の組合せを登録': 'Record each combination of abilities',
  '所持品を登録': 'Manage inventory', '変更は自動保存されます': 'Changes are saved automatically', '所持品カテゴリ': 'Inventory categories',
  '実カタログを読み込んでいます…': 'Loading the game catalog…', 'カタログを取得できませんでした': 'Could not load the catalog',
  '通信状態を確認して再試行してください。保存済みの所持情報は変更していません。': 'Check your connection and try again. Your saved inventory has not changed.',
  'カタログを再読込み': 'Reload catalog', ' 種類': ' types',
  '条件に一致する装飾品はありません。検索語や絞り込みを変更してください。': 'No decorations match. Try another search or change the filters.',
  '条件に一致する固定護石はありません。': 'No crafted charms match.', '鑑定護石を検索': 'Search appraisal charms',
  'ラベル・個体ID・スキル名': 'Label, instance ID or skill name', '＋ 鑑定護石を登録': '+ Add appraisal charm', ' 個体': ' instances',
  '条件に一致する鑑定護石はありません。': 'No appraisal charms match.',
  '鑑定護石はまだ登録されていません。ゲーム内で確認した能力を登録してください。': 'No appraisal charms registered yet. Enter the abilities shown in the game.',
  '大切な所持情報をバックアップ': 'Back up your inventory',
  'データは端末・ブラウザ・サイトの保存領域ごとに管理されます。ブラウザのデータ削除や端末変更に備え、定期的にJSONを保存してください。所持品の編集とJSON処理はブラウザ内で完結します。': 'Inventory is stored separately for each device, browser and site. Save a JSON backup regularly before clearing browser data or changing devices. Inventory editing and JSON processing stay in your browser.',
  'JSONをダウンロード': 'Download JSON', 'JSONから復元': 'Restore from JSON', '復元するJSONファイル': 'JSON backup to restore',
  '元の保存データを退避': 'Export original saved data', '所持情報を初期化': 'Reset inventory', 'バックアップを検証しています…': 'Validating the backup…',
  '使い方・保存・連携について': 'Help, storage and simulator integration',
  '装飾品・固定護石の数量を入力します。0個は未所持です。固定護石も複数個の情報を保持します。': 'Enter decoration and crafted charm quantities. Zero means not owned. Multiple copies of crafted charms are also supported.',
  '鑑定護石はスキル名を選び、レベル・スロット・レア度を入力します。現在のルールに一致した個体を保存できます。': 'For appraisal charms, select skill names and enter levels, slots and rarity. You can save charms matching the current rules.',
  '上部のスキルシミュレーターへ移動し、「所持品を考慮する」を選ぶと、同じブラウザ内の所持情報を検索条件に利用します。': 'Open the Skill Simulator above and enable owned inventory to use the inventory saved in this browser as search constraints.',
  'カタログにないIDや検証できない護石は保存したまま警告します。現在の検索に適用できない場合があります。': 'Unknown IDs and unverifiable charms are preserved with a warning. They may be unavailable for the current search.',
  'JSONの統合は同じIDの所持数を加算せず、大きい方を採用します。同じ鑑定護石IDで能力が異なる場合は統合を中止します。別の個体IDは同じ能力でも別個体として扱います。': 'Merging JSON keeps the larger quantity for each ID instead of adding quantities. If the same appraisal charm ID has different abilities, the merge is blocked. Different instance IDs remain separate even if their abilities match.',
  '保存競合やエラー時は未保存の内容をJSONで退避し、最新の保存データを読み込んでから統合してください。通常のJSONダウンロードに破損した元データは含まれません。': 'After a save conflict or error, export unsaved changes to JSON, reload the latest saved data, then merge. Standard JSON downloads do not contain damaged original data.',
  'MHWILDS 所持品チェッカー': 'MHWILDS Inventory Checker', 'カタログ・保存情報': 'Catalog and storage details', 'カタログ版': 'Catalog revision',
  '未取得': 'Not loaded', '生成日時': 'Generated at', '保存形式': 'Storage format', 'プロフィールID': 'Profile ID', '未登録': 'Not registered', '最終更新': 'Last updated',
  '鑑定護石を削除': 'Delete appraisal charm', '「{0}」（{1}個）を削除します。': 'Delete “{0}” (quantity: {1}).',
  'この操作は元に戻せません。必要に応じて先にJSONをダウンロードしてください。': 'This cannot be undone. Download a JSON backup first if needed.',
  'キャンセル': 'Cancel', 'この鑑定護石を削除': 'Delete this appraisal charm',
  '装飾品 {0}種類、固定護石 {1}種類、鑑定護石 {2}個体の登録を削除します。': 'Remove {0} decoration types, {1} crafted charm types and {2} appraisal charm instances.',
  '先にJSONをダウンロードしてください。破損した元データは復旧用に保持されます。': 'Download JSON first. Damaged original data will be retained for recovery.',
  'JSONを退避': 'Export JSON backup', '登録をすべて初期化': 'Reset all inventory', '最新の保存データを読込み': 'Load the latest saved data',
  'この画面にある未保存の変更は失われます。先にJSONへ退避してから読み込んでください。': 'Unsaved changes on this screen will be lost. Export them to JSON before reloading.',
  '保存データを読み込む': 'Load saved data', 'バックアップの取込確認': 'Confirm backup import', 'バックアップの更新日時：': 'Backup last updated: ',
  '種類': ' types', '取込方法を選択': 'Choose an import method', '現在の所持情報と統合': 'Merge with current inventory',
  '同じIDは所持数の大きい方を採用します。加算しません。': 'Keep the larger quantity for matching IDs. Quantities are not added.',
  'バックアップで全体を置換': 'Replace all inventory with the backup', '現在の登録内容をバックアップの内容に入れ替えます。': 'Replace your current entries with the contents of the backup.',
  '変更対象：': 'Changed entries: ', '件': ' entries', '個体IDの能力が衝突しているため統合できません。': 'Cannot merge: matching instance IDs have conflicting abilities.',
  'プレビュー後に所持情報が更新されました。閉じてJSONを読み込み直してください。': 'Your inventory changed after this preview. Close the dialog and import the JSON again.',
  '破損した保存データを復旧用に保持して、このバックアップから復元します。': 'Restore this backup while retaining damaged saved data for recovery.',
  '統合して保存': 'Merge and save', '全体を置換して保存': 'Replace all and save', '未所持 ': 'Not owned: ', '種類 · 合計 ': ' types · Total: ', '個': ' items',
  '{0}の所持種類': 'Owned {0} types',
  '検証不能：現在の検索に適用できません。登録内容は保持しています。': 'Unverifiable: unavailable for the current search. Your entry is preserved.',
  '能力不一致：現在のルールでは検索に適用できません。': 'Abilities do not match: unavailable for searches under the current rules.',
  '{0}を編集': 'Edit {0}', '編集': 'Edit', '{0}を複製': 'Duplicate {0}', '複製': 'Duplicate', '{0}を削除': 'Delete {0}', '削除': 'Delete',
  'ゲーム内の表示に合わせて能力を入力してください。スキル・レベル・スロットの組合せを実カタログの鑑定ルールで検証します。': 'Enter the abilities shown in the game. Skills, levels and slots are checked against the appraisal rules in the game catalog.',
  '編集中に所持情報が更新されました。変更を控え、この画面を閉じて最新の内容から編集し直してください。': 'Your inventory changed while editing. Note your changes, close this dialog and edit the latest saved version.',
  'ルールから入力を開始': 'Start from a rule', 'パターンを選択（任意）': 'Select a pattern (optional)', '表示ラベル（任意）': 'Display label (optional)',
  '例：普段使いの護石': 'Example: Everyday charm', 'レア度': 'Rarity', 'スキル': 'Skills', 'スキル ': 'Skill ', 'スキルを選択': 'Select a skill', 'レベル ': 'Level ',
  'スキル {0} を削除': 'Remove skill {0}', '＋ スキルを追加': '+ Add skill', 'スロット（ゲーム内の表示順）': 'Slots (in game display order)',
  'スロット ': 'Slot ', ' の種類': ' type', ' のレベル': ' level', '（現在の値）': ' (current value)', 'スロット {0} を削除': 'Remove slot {0}', '＋ スロットを追加': '+ Add slot',
  '所持数': 'Quantity owned', '1以上の安全な整数を入力してください。': 'Enter a whole number from 1 to 9,007,199,254,740,991.',
  '登録可能な能力です': 'These abilities can be saved', '現在のカタログでは検証できません': 'Cannot verify with the current catalog', '能力の組合せを確認してください': 'Check the combination of abilities',
  'スキルの重複や未入力、レベル・レア度・スロットの数値を確認してください。': 'Check for missing or duplicate skills and invalid levels, rarity or slot values.',
  '件のパターンに一致しています。複数一致も登録できます。': ' matching patterns. Multiple matches can also be saved.', 'この護石を保存': 'Save this charm',
  '編集中に保存内容が更新されました。入力中の値は未保存です。最新の保存値は{0}個です。確認してから入力し直してください。': 'Saved data changed while editing. Your draft is not saved. The latest saved quantity is {0}. Review it before entering a new value.',
  '0以上の安全な整数を入力してください。空欄・小数は保存されません。': 'Enter a whole number from 0 to 9,007,199,254,740,991. Blank values and decimals are not saved.',
  '保存内容が更新されています。入力中の値は未保存です。最新の保存値を確認してください。': 'Saved data has changed. Your draft is not saved. Check the latest saved value.',
  '{0}を1個減らす': 'Decrease {0} by 1', '{0}の所持数': 'Quantity owned: {0}', '{0}を1個増やす': 'Increase {0} by 1',
  '{0}の入力を最新の保存値に戻す': 'Restore the latest saved quantity for {0}', '最新の保存値に戻す': 'Restore latest saved value', '閉じる': 'Close',
  '別のタブの変更を読み込みました。編集中の護石や取込プレビューは再確認してください。': 'Changes from another tab were loaded. Review any open charm editor or import preview.',
  '保存内容が変更されています。編集中の内容を確認し、最新の保存データを読み込んでからやり直してください。': 'Saved data has changed. Review your draft and load the latest saved data before trying again.',
  '入力内容を保存できません。値の範囲や重複を確認してください。': 'Cannot save this input. Check value ranges and duplicates.',
  '別のタブと保存が競合しました。この画面の変更は未保存です。JSONを退避してから最新の保存データを読み込んでください。': 'Save conflict with another tab. Changes on this screen are not saved. Export JSON before loading the latest saved data.',
  '保存できませんでした。この画面の変更は未保存です。JSONをダウンロードして退避してください。': 'Could not save. Changes on this screen are not saved. Download JSON to preserve them.',
  '保存できませんでした。JSONをダウンロードして退避してください。': 'Could not save. Download JSON to preserve your changes.',
  '武器スロットは先頭に最大1個、防具スロットは最大3個です。': 'At most one weapon slot is allowed, in the first position, followed by at most three armor slots.',
  '鑑定護石ルールが未取得です。': 'Appraisal charm rules have not been loaded.', '現在のカタログにないスキル: {0}': 'Skill missing from the current catalog: {0}',
  'スキルの種別またはレベルが不正です。': 'The skill type or level is invalid.', 'レア度・スキル・スロットの組み合わせが取得済みルールに一致しません。': 'The combination of rarity, skills and slots does not match the loaded rules.',
  'バックアップと現在のカタログのリビジョンが異なります。': 'The backup and current catalog have different revisions.',
  '未解決の装飾品を保持: {0}': 'Preserving an unresolved decoration: {0}', '未解決の固定護石を保持: {0}': 'Preserving an unresolved crafted charm: {0}',
  '鑑定護石 {0}: {1}': 'Appraisal charm {0}: {1}', 'カタログ未取得のため参照・護石ルールは未検証です。': 'Catalog references and charm rules cannot be verified until the catalog is loaded.',
  '装飾品 {0} ({1}個)': 'Decoration {0} (quantity: {1})', '固定護石 {0} ({1}個)': 'Crafted charm {0} (quantity: {1})',
  '翻訳名を読み込めませんでした。元の名前を表示しています。': 'Translated names could not be loaded. Original names are shown.',
  '言語': 'Language',
}

const format = (message: string, values: (string | number)[]) => message.replace(/\{(\d+)\}/g, (match, index: string) => String(values[Number(index)] ?? match))
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const templates = Object.entries(english).filter(([source]) => /\{\d+\}/.test(source)).map(([ja, en]) => ({ ja, en, jaPattern: new RegExp('^' + ja.split(/\{\d+\}/).map(escape).join('(.*?)') + '$'), enPattern: new RegExp('^' + en.split(/\{\d+\}/).map(escape).join('(.*?)') + '$') }))
const originals = new Map(Object.entries(english).map(([ja, en]) => [en, ja]))
const validationReasons: Record<string, string> = {
  'object required': 'オブジェクトが必要です', 'plain object required': '通常のオブジェクトが必要です', 'unknown key': '未対応の項目です', required: '必須項目です',
  'nonblank trimmed identifier required (max 512)': '前後の空白を除いた1〜512文字のIDが必要です', 'unknown enum': '未対応の値です',
  'unsupported schema version': '未対応の保存形式です', 'UTC ISO timestamp required': 'UTCのISO形式の日時が必要です', 'invalid timestamp': '日時が不正です',
  'string of at most 200 characters required': '200文字以内の文字列が必要です', 'file exceeds safety size limit': 'ファイルが安全上のサイズ上限を超えています',
  'JSON depth exceeds safety limit': 'JSONの入れ子が安全上の上限を超えています', 'invalid JSON': 'JSONの形式が不正です',
}
export function translate(locale: Locale, message: string, ...values: (string | number)[]): string {
  if (Object.hasOwn(english, message)) return format(locale === 'en' ? english[message]! : message, values)
  const original = originals.get(message)
  if (original) return locale === 'ja' ? original : message
  for (const entry of templates) {
    const match = message.match(locale === 'en' ? entry.jaPattern : entry.enPattern)
    if (match) {
      const parameters = match.slice(1)
      if (entry.ja === '鑑定護石 {0}: {1}' && parameters[1]) parameters[1] = translate(locale, parameters[1])
      return format(locale === 'en' ? entry.en : entry.ja, parameters)
    }
  }
  if (locale === 'ja' && /^(?:ValidationError: )?\$/.test(message)) {
    let result = message.replace(/: safe integer >= (\d+) required$/, ': $1以上の安全な整数が必要です').replace(/: array length must be (\d+)\.\.(\d+)$/, ': 配列の要素数は$1〜$2で指定してください').replace(/: duplicate ID (.*)$/, ': IDが重複しています: $1')
    for (const [reason, translation] of Object.entries(validationReasons)) {
      if (result.endsWith(': ' + reason)) result = result.slice(0, -reason.length) + translation
    }
    return result
  }
  return message
}
