import { inspectProfile } from '../domain'
import type { CheckerCatalog, InventoryProfile } from '../domain'
import type { Locale } from './locale'
import { translate } from './messages'

// Keep IDs separate from human-readable issues instead of parsing a joined domain message.
export function localizedProfileWarnings(profile: InventoryProfile, catalog: CheckerCatalog, locale: Locale): string[] {
  const issues = inspectProfile(profile, catalog)
  const t = (message: string, ...values: (string | number)[]) => translate(locale, message, ...values)
  return [
    ...(issues.catalog_mismatch ? [t('バックアップと現在のカタログのリビジョンが異なります。')] : []),
    ...issues.orphan_decorations.map((id) => t('未解決の装飾品を保持: {0}', id)),
    ...issues.orphan_fixed_charms.map((id) => t('未解決の固定護石を保持: {0}', id)),
    ...issues.appraisal_charms.map((entry) => t('鑑定護石 {0}: {1}', entry.instance_id, entry.validation.issues.map((issue) => t(issue)).join(' '))),
  ]
}
