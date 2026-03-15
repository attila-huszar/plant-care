import { onBeforeUnmount, onMounted } from 'vue'
import {
  findComposerInputNearSend,
  getSpeechRecognition,
  getSpeechSynthesis,
  isElementVisible,
  setComposerText,
} from '@/utils'
import {
  ELFSIGHT_MIC_ICON,
  ELFSIGHT_SOUND_OFF_ICON,
  ELFSIGHT_SOUND_ON_ICON,
  type SvgIconSpec,
} from '@/assets/svg'

export function useElfsightVoice() {
  let portalObserver: MutationObserver | null = null
  let messageObserver: MutationObserver | null = null
  let controlsObserver: MutationObserver | null = null

  let isReadAloudEnabled = false
  const speakTimeoutById = new Map<string, number>()
  const lastSpokenTextById = new Map<string, string>()

  function speak(text: string) {
    const { supported, synth, Utterance } = getSpeechSynthesis()
    if (!supported || !synth || !Utterance) return

    synth.cancel()
    const utter = new Utterance(text)
    utter.lang = navigator.language || 'en-US'
    synth.speak(utter)
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
    ).filter(isElementVisible)

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
        icon: ELFSIGHT_SOUND_OFF_ICON,
        title: 'Read aloud (off)',
      })

      if (!getSpeechSynthesis().supported) {
        readBtn.disabled = true
        readBtn.title = 'Read aloud not supported in this browser'
        readBtn.style.opacity = '0.6'
        readBtn.style.cursor = 'not-allowed'
      } else {
        readBtn.addEventListener('click', () => {
          isReadAloudEnabled = !isReadAloudEnabled
          getSpeechSynthesis().synth?.cancel()

          readBtn!.title = isReadAloudEnabled
            ? 'Read aloud (on)'
            : 'Read aloud (off)'

          const nextIcon = isReadAloudEnabled
            ? ELFSIGHT_SOUND_ON_ICON
            : ELFSIGHT_SOUND_OFF_ICON
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
        icon: ELFSIGHT_MIC_ICON,
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

    getSpeechSynthesis().synth?.cancel()
  })
}
