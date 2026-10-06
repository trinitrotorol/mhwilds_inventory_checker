import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Modal } from './Modal'

function Example() {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>開く</button>{open && <Modal title="確認" onClose={() => setOpen(false)}><button onClick={() => setOpen(false)}>キャンセル</button><button>最後の操作</button></Modal>}</>
}
describe('Modal', () => {
  it('traps Tab and returns focus after native Escape cancellation', () => {
    render(<Example />)
    const trigger = screen.getByRole('button', { name: '開く' })
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: '確認' })
    const first = screen.getByRole('button', { name: '閉じる' })
    const last = screen.getByRole('button', { name: '最後の操作' })
    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
