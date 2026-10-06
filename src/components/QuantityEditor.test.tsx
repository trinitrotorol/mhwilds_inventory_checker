import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QuantityEditor } from './QuantityEditor'

describe('QuantityEditor', () => {
  it('preserves quantities greater than one and rejects invalid drafts', () => {
    const change = vi.fn()
    const adjust = vi.fn()
    render(<QuantityEditor name="検証護石" value={4} onChange={change} onAdjust={adjust} />)
    const input = screen.getByRole('textbox', { name: '検証護石の所持数' })
    expect(input).toHaveValue('4')
    for (const value of ['', '-1', '1.2', '9007199254740992']) {
      fireEvent.change(input, { target: { value } })
      fireEvent.blur(input)
    }
    expect(change).not.toHaveBeenCalled()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    fireEvent.change(input, { target: { value: '8' } })
    fireEvent.blur(input)
    expect(change).toHaveBeenCalledWith(8)
    fireEvent.click(screen.getByRole('button', { name: '検証護石を1個増やす' }))
    expect(adjust).toHaveBeenCalledWith(1)
  })
})
