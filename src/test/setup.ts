import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
    this.querySelector<HTMLElement>('[autofocus], button, input, select')?.focus()
  }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
}

afterEach(() => {
  cleanup()
})
