export const getSpeechRecognition = ():
  | SpeechRecognitionConstructor
  | undefined => window.SpeechRecognition ?? window.webkitSpeechRecognition

export const getSpeechSynthesis = (): {
  supported: boolean
  synth?: SpeechSynthesis
  Utterance?: typeof SpeechSynthesisUtterance
} => {
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : undefined
  const Utterance =
    'SpeechSynthesisUtterance' in window
      ? window.SpeechSynthesisUtterance
      : undefined

  const supported =
    !!synth &&
    !!Utterance &&
    typeof synth.cancel === 'function' &&
    typeof synth.speak === 'function'

  return { supported, synth, Utterance }
}
