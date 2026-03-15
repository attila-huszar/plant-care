import { onBeforeUnmount, onMounted } from 'vue'

export function useElfsightVoice() {
  let portalObserver: MutationObserver | null = null
  let messageObserver: MutationObserver | null = null
  let controlsObserver: MutationObserver | null = null

  let isReadAloudEnabled = false
  const speakTimeoutById = new Map<string, number>()
  const lastSpokenTextById = new Map<string, string>()

  function isVisible(el: Element | null): el is HTMLElement {
    if (!el) return false
    const node = el as HTMLElement
    const style = window.getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    const rect = node.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }

  function findComposerInputNearSend(
    root: HTMLElement,
    send: HTMLButtonElement,
  ): HTMLElement | null {
    const selectors = [
      '#interactionInput',
      'textarea',
      'input[type="text"]',
      'input:not([type])',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ]

    const pickBest = (container: HTMLElement): HTMLElement | null => {
      for (const selector of selectors) {
        const el = container.querySelector<HTMLElement>(selector)
        if (isVisible(el)) return el
      }
      return null
    }

    let current: HTMLElement | null = send
    for (let i = 0; i < 8; i++) {
      if (!current) break
      const parentEl: HTMLElement | null = current.parentElement
      if (!parentEl) break

      const candidate = pickBest(parentEl)
      if (candidate) return candidate

      current = parentEl
    }

    const fallback = root.querySelector<HTMLElement>('#interactionInput')
    return isVisible(fallback) ? fallback : null
  }

  function setComposerText(input: HTMLElement, text: string): boolean {
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

  type SvgIconSpec = {
    viewBox: string
    pathD: string
  }

  const MIC_ICON: SvgIconSpec = {
    viewBox: '0 0 640 640',
    pathD:
      'M320 64c-53 0-96 43-96 96v128c0 53 43 96 96 96s96-43 96-96V160c0-53-43-96-96-96M176 248c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 97.9 73.3 178.7 168 190.5V528h-48c-13.3 0-24 10.7-24 24s10.7 24 24 24h144c13.3 0 24-10.7 24-24s-10.7-24-24-24h-48v-49.5c94.7-11.8 168-92.6 168-190.5v-40c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 79.5-64.5 144-144 144s-144-64.5-144-144z',
  }

  const SOUND_ON_ICON: SvgIconSpec = {
    viewBox: '0 0 640 640',
    pathD:
      'M112 416h48l134.1 119.2c6.4 5.7 14.6 8.8 23.1 8.8 19.2 0 34.8-15.6 34.8-34.8V130.8c0-19.2-15.6-34.8-34.8-34.8-8.5 0-16.7 3.1-23.1 8.8L160 224h-48c-26.5 0-48 21.5-48 48v96c0 26.5 21.5 48 48 48m393.1-245c-10.3-8.4-25.4-6.8-33.8 3.5s-6.8 25.4 3.5 33.8C507.3 234.7 528 274.9 528 320s-20.7 85.3-53.2 111.8c-10.3 8.4-11.8 23.5-3.5 33.8s23.5 11.8 33.8 3.5c43.2-35.2 70.9-88.9 70.9-149s-27.7-113.8-70.9-149zm-60.5 74.5c-10.3-8.4-25.4-6.8-33.8 3.5s-6.8 25.4 3.5 33.8C425.1 291.6 432 305 432 320s-6.9 28.4-17.7 37.3c-10.3 8.4-11.8 23.5-3.5 33.8s23.5 11.8 33.8 3.5c21.5-17.7 35.4-44.5 35.4-74.6s-13.9-56.9-35.5-74.5z',
  }

  const SOUND_OFF_ICON: SvgIconSpec = {
    viewBox: '0 0 640 640',
    pathD:
      'M256 416h-48c-26.5 0-48-21.5-48-48v-96c0-26.5 21.5-48 48-48h48l134.1-119.2c6.4-5.7 14.6-8.8 23.1-8.8 19.2 0 34.8 15.6 34.8 34.8v378.4c0 19.2-15.6 34.8-34.8 34.8-8.5 0-16.7-3.1-23.1-8.8z',
  }

  function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
    return window.SpeechRecognition ?? window.webkitSpeechRecognition
  }

  function speak(text: string) {
    speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = navigator.language || 'en-US'
    speechSynthesis.speak(utter)
  }

  function extractAssistantMessageText(message: HTMLElement): string {
    const content = message.querySelector<HTMLElement>(
      '.es-message-content-container',
    )
    if (!content) return ''

    const parts = Array.from(content.querySelectorAll('p, li'))
      .map((el) => el.textContent?.trim() ?? '')
      .filter(Boolean)

    const text = (parts.length ? parts.join('\n') : content.textContent)?.trim()
    if (!text) return ''

    if (text.startsWith('Thinking')) return ''

    return text
  }

  function scheduleSpeak(root: HTMLElement, message: HTMLElement) {
    if (!isReadAloudEnabled) return

    const id = message.id
    if (!id) return
    if (lastSpokenTextById.has(id)) return

    const existing = speakTimeoutById.get(id)
    if (existing) window.clearTimeout(existing)

    const timeout = window.setTimeout(() => {
      const selector = `[data-role="assistant"][id="${CSS.escape(id)}"]`
      const latest = root.querySelector<HTMLElement>(selector)
      if (!latest) return

      const text = extractAssistantMessageText(latest)
      if (!text) return

      lastSpokenTextById.set(id, text)
      speak(text)
    }, 650)

    speakTimeoutById.set(id, timeout)
  }

  function observeMessages(root: HTMLElement) {
    if (messageObserver) return

    messageObserver = new MutationObserver(() => {
      const messages = root.querySelectorAll<HTMLElement>(
        '[data-role="assistant"][id]',
      )

      messages.forEach((msg) => {
        scheduleSpeak(root, msg)
      })
    })

    messageObserver.observe(root, {
      childList: true,
      subtree: true,
    })
  }

  function createIconButton(
    sendButton: HTMLButtonElement,
    options: {
      id: string
      label: string
      icon: SvgIconSpec
      title: string
    },
  ) {
    const btn = document.createElement('button')
    btn.id = options.id
    btn.type = 'button'
    btn.className = sendButton.className

    btn.setAttribute('aria-label', options.label)
    btn.title = options.title

    const iconContainerClass =
      (sendButton.firstElementChild as HTMLElement | null)?.className ?? ''

    const iconContainer = document.createElement('div')
    if (iconContainerClass) iconContainer.className = iconContainerClass

    const iconInner = document.createElement('div')

    const iconWrapper = document.createElement('span')
    iconWrapper.setAttribute('aria-hidden', 'true')
    iconWrapper.style.display = 'inline-flex'
    iconWrapper.style.alignItems = 'center'
    iconWrapper.style.justifyContent = 'center'
    iconWrapper.style.width = '16px'
    iconWrapper.style.height = '16px'

    const svgNs = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(svgNs, 'svg')
    svg.setAttribute('viewBox', options.icon.viewBox)
    svg.setAttribute('fill', 'currentColor')
    svg.setAttribute('width', '16')
    svg.setAttribute('height', '16')
    svg.style.display = 'block'

    const path = document.createElementNS(svgNs, 'path')
    path.setAttribute('d', options.icon.pathD)
    svg.appendChild(path)

    iconWrapper.appendChild(svg)
    iconInner.appendChild(iconWrapper)
    iconContainer.appendChild(iconInner)
    btn.replaceChildren(iconContainer)

    return btn
  }

  function ensureControls(root: HTMLElement) {
    const sends = Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        'button[aria-label="Send message"]',
      ),
    ).filter(isVisible)

    const picked = sends
      .map((send) => ({ send, input: findComposerInputNearSend(root, send) }))
      .filter((x) => !!x.input)
      .at(-1)

    const send = picked?.send
    const host = send?.parentElement as HTMLElement | null
    if (!send || !host) return

    const hostContainsTextbox = !!host.querySelector(
      'textarea,input,[contenteditable="true"],[role="textbox"]',
    )

    const leftGroupId = 'elfsight-actions-left'
    let buttonHost: HTMLElement = host
    if (!hostContainsTextbox) {
      host.style.display = 'flex'
      host.style.alignItems = 'center'
      host.style.justifyContent = 'flex-end'
      host.style.gap = '8px'
      host.style.width = '100%'
      host.style.boxSizing = 'border-box'

      let leftGroup = host.querySelector<HTMLElement>(`#${leftGroupId}`)
      if (!leftGroup) {
        leftGroup = document.createElement('div')
        leftGroup.id = leftGroupId
        leftGroup.style.display = 'inline-flex'
        leftGroup.style.alignItems = 'center'
        leftGroup.style.gap = '8px'
        leftGroup.style.flex = '0 0 auto'
        leftGroup.style.marginRight = 'auto'
        host.insertBefore(leftGroup, host.firstChild)
      }

      buttonHost = leftGroup
    }

    const readId = 'elfsight-read-toggle'
    const micId = 'elfsight-mic'

    let readBtn = root.querySelector<HTMLButtonElement>(`#${readId}`)
    if (!readBtn) {
      readBtn = createIconButton(send, {
        id: readId,
        label: 'Toggle read aloud',
        icon: SOUND_OFF_ICON,
        title: 'Read aloud (off)',
      })

      readBtn.addEventListener('click', () => {
        isReadAloudEnabled = !isReadAloudEnabled
        speechSynthesis.cancel()

        readBtn!.title = isReadAloudEnabled
          ? 'Read aloud (on)'
          : 'Read aloud (off)'

        const nextIcon = isReadAloudEnabled ? SOUND_ON_ICON : SOUND_OFF_ICON
        const wrapper = readBtn!.querySelector('span[aria-hidden="true"]')
        if (wrapper) {
          const svgNs = 'http://www.w3.org/2000/svg'
          const svg = document.createElementNS(svgNs, 'svg')
          svg.setAttribute('viewBox', nextIcon.viewBox)
          svg.setAttribute('fill', 'currentColor')
          svg.setAttribute('width', '16')
          svg.setAttribute('height', '16')
          svg.style.display = 'block'

          const path = document.createElementNS(svgNs, 'path')
          path.setAttribute('d', nextIcon.pathD)
          svg.appendChild(path)
          wrapper.replaceChildren(svg)
        }

        if (isReadAloudEnabled) {
          const last = Array.from(
            root.querySelectorAll<HTMLElement>('[data-role="assistant"][id]'),
          ).at(-1)
          if (last) scheduleSpeak(root, last)
        }
      })
    }

    if (readBtn.parentElement !== buttonHost) {
      if (buttonHost === host) host.insertBefore(readBtn, send)
      else buttonHost.appendChild(readBtn)
    }

    let micBtn = root.querySelector<HTMLButtonElement>(`#${micId}`)
    if (!micBtn) {
      micBtn = createIconButton(send, {
        id: micId,
        label: 'Voice input',
        icon: MIC_ICON,
        title: 'Voice input',
      })

      const Recognition = getSpeechRecognition()
      if (!Recognition) {
        micBtn.disabled = true
        micBtn.title = 'Voice input not supported in this browser'
        micBtn.style.opacity = '0.6'
        micBtn.style.cursor = 'not-allowed'
      } else {
        const recognition = new Recognition()
        recognition.lang = navigator.language || 'en-US'

        micBtn.addEventListener('click', () => recognition.start())

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0]?.[0]?.transcript?.trim()
          if (!transcript) return

          const input = findComposerInputNearSend(root, send)
          if (!input) return

          const didSet = setComposerText(input, transcript)
          if (!didSet) return

          send.click()
          recognition.stop()
        }
      }
    }

    if (micBtn.parentElement !== buttonHost) {
      if (buttonHost === host) host.insertBefore(micBtn, send)
      else buttonHost.appendChild(micBtn)
    }
  }

  function observeControls(root: HTMLElement) {
    if (controlsObserver) return

    controlsObserver = new MutationObserver(() => {
      ensureControls(root)
    })

    controlsObserver.observe(root, {
      childList: true,
      subtree: true,
    })
  }

  function init(root: HTMLElement) {
    ensureControls(root)
    observeControls(root)
    observeMessages(root)
  }

  function watchForPortal() {
    const existing = document.querySelector<HTMLElement>('#__EAAPS_PORTAL')
    if (existing) {
      init(existing)
      return
    }

    portalObserver = new MutationObserver(() => {
      const portal = document.querySelector<HTMLElement>('#__EAAPS_PORTAL')
      if (!portal) return

      init(portal)

      if (portalObserver) {
        portalObserver.disconnect()
        portalObserver = null
      }
    })

    portalObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  onMounted(() => {
    watchForPortal()
  })

  onBeforeUnmount(() => {
    if (portalObserver) {
      portalObserver.disconnect()
      portalObserver = null
    }

    if (messageObserver) {
      messageObserver.disconnect()
      messageObserver = null
    }

    if (controlsObserver) {
      controlsObserver.disconnect()
      controlsObserver = null
    }

    speakTimeoutById.forEach((t) => window.clearTimeout(t))
    speakTimeoutById.clear()
    lastSpokenTextById.clear()

    speechSynthesis.cancel()
  })
}
