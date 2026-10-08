import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLocale } from '../i18n/context'

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const { t } = useLocale()
  const dialog = useRef<HTMLDialogElement>(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    if (!element) return
    element.showModal()
    const cancel = (event: Event) => { event.preventDefault(); close.current() }
    element.addEventListener('cancel', cancel)
    return () => {
      element.removeEventListener('cancel', cancel)
      element.close()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])
  return <dialog ref={dialog} className="modal" aria-labelledby="dialog-title" onKeyDown={(event) => {
    if (event.key !== 'Tab') return
    const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]'))
    const first = elements[0]
    const last = elements.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }}>
    <div className="section-heading"><h2 id="dialog-title">{t(title)}</h2><button type="button" className="icon-button" aria-label={t("閉じる")} onClick={onClose}>×</button></div>
    {children}
  </dialog>
}
