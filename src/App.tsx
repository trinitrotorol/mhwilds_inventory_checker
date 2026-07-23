const plannedInventoryTypes = [
  {
    label: '装飾品',
    description: '種類ごとの所持数を整理できるようにします。',
  },
  {
    label: '固定護石',
    description: '作成済みの護石を一覧から確認できるようにします。',
  },
  {
    label: '鑑定護石',
    description: '鑑定結果を検証しながら登録できるようにします。',
  },
] as const

export function App() {
  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">所持品管理</p>
        <h1 id="page-title">MHWILDS 所持品チェッカー</h1>
        <p className="status" role="status">
          準備中
        </p>
        <p className="lead">
          装飾品・固定護石・鑑定護石の所持状況を、ブラウザ内で整理するためのチェッカーを準備しています。
        </p>
      </section>

      <section className="scope" aria-labelledby="planned-features-title">
        <div className="section-heading">
          <p className="section-kicker">今後の予定</p>
          <h2 id="planned-features-title">今後扱う所持品</h2>
        </div>

        <ul className="inventory-types">
          {plannedInventoryTypes.map((inventoryType) => (
            <li key={inventoryType.label}>
              <span className="inventory-type-marker" aria-hidden="true" />
              <div>
                <h3>{inventoryType.label}</h3>
                <p>{inventoryType.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="privacy-note">
        初期版はアカウントやサーバーを使わず、データをこのブラウザ内だけで扱う予定です。
      </p>
    </main>
  )
}
