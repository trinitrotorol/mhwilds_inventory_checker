import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App', () => {
  it('shows the product heading and preparation state', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'MHWILDS 所持品チェッカー',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('準備中')
  })

  it('describes the three planned inventory types without showing game data', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 3, name: '装飾品' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '固定護石' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '鑑定護石' })).toBeInTheDocument()
  })
})
