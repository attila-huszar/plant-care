export const isElementVisible = (el: Element | null): el is HTMLElement => {
  if (!el) return false
  const node = el as HTMLElement
  const style = window.getComputedStyle(node)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  const rect = node.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

export const findComposerInputNearSend = (
  root: HTMLElement,
  send: HTMLButtonElement,
): HTMLElement | null => {
  const selectors = [
    '#interactionInput',
    'textarea',
    'input[type="text"]',
    'input:not([type])',
    '[contenteditable="true"]',
    '[role="textbox"]',
  ]

  const findVisibleComposerInputIn = (
    container: HTMLElement,
  ): HTMLElement | null => {
    for (const selector of selectors) {
      const el = container.querySelector<HTMLElement>(selector)
      if (isElementVisible(el)) return el
    }
    return null
  }

  let current: HTMLElement | null = send
  for (let i = 0; i < 8; i++) {
    if (!current) break
    const parentEl: HTMLElement | null = current.parentElement
    if (!parentEl) break

    const candidate = findVisibleComposerInputIn(parentEl)
    if (candidate) return candidate

    current = parentEl
  }

  const fallback = root.querySelector<HTMLElement>('#interactionInput')
  return isElementVisible(fallback) ? fallback : null
}

export const setComposerText = (input: HTMLElement, text: string): boolean => {
  input.focus()

  if (
    input instanceof HTMLTextAreaElement ||
    input instanceof HTMLInputElement
  ) {
    const proto =
      input instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
    const valueDescriptor = Object.getOwnPropertyDescriptor(proto, 'value')
    valueDescriptor?.set?.call(input, text)
  } else if (
    input.isContentEditable ||
    input.getAttribute('contenteditable') === 'true'
  ) {
    input.textContent = text
  } else {
    return false
  }

  const inputEvent =
    typeof InputEvent !== 'undefined'
      ? new InputEvent('input', {
          bubbles: true,
          data: text,
          inputType: 'insertText',
        })
      : new Event('input', { bubbles: true })

  input.dispatchEvent(inputEvent)
  return true
}
