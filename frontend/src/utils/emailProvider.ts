type EmailProviderInfo = {
  name: string
  url: string
}

const EMAIL_PROVIDERS: {
  name: string
  domains: string[]
  url: string | ((domain: string) => string)
}[] = [
  {
    name: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    url: 'https://mail.google.com/',
  },
  {
    name: 'Outlook',
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    url: 'https://outlook.live.com/mail/',
  },
  {
    name: 'Yahoo Mail',
    domains: ['yahoo.com', 'ymail.com'],
    url: 'https://mail.yahoo.com/',
  },
  {
    name: 'iCloud Mail',
    domains: ['icloud.com', 'me.com', 'mac.com'],
    url: 'https://www.icloud.com/mail',
  },
  {
    name: 'Proton Mail',
    domains: ['proton.me', 'protonmail.com'],
    url: 'https://mail.proton.me/',
  },
  {
    name: 'AOL Mail',
    domains: ['aol.com'],
    url: 'https://mail.aol.com/',
  },
  {
    name: 'Zoho Mail',
    domains: ['zoho.com'],
    url: 'https://mail.zoho.com/',
  },
  {
    name: 'Yandex Mail',
    domains: ['yandex.ru', 'yandex.com'],
    url: (domain) =>
      domain === 'yandex.ru'
        ? 'https://mail.yandex.ru/'
        : 'https://mail.yandex.com/',
  },
  {
    name: 'GMX',
    domains: ['gmx.com', 'gmx.net', 'gmx.de', 'gmx.at', 'gmx.ch'],
    url: (domain) => `https://www.${domain}/`,
  },
  {
    name: 'Mail.com',
    domains: ['mail.com'],
    url: 'https://www.mail.com/',
  },
]

const extractEmailDomain = (email: string): string | null => {
  if (typeof email !== 'string') return null
  const at = email.lastIndexOf('@')
  if (at < 0) return null

  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase()

  if (!domain) return null
  if (domain.includes('..')) return null
  if (!/^[a-z0-9.-]+$/.test(domain)) return null
  if (domain.startsWith('.') || domain.endsWith('.')) return null

  return domain
}

export const getEmailProviderInbox = (
  email: string,
): EmailProviderInfo | null => {
  const domain = extractEmailDomain(email)
  if (!domain) return null

  for (const provider of EMAIL_PROVIDERS) {
    if (!provider.domains.includes(domain)) continue
    const url =
      typeof provider.url === 'function' ? provider.url(domain) : provider.url
    return { name: provider.name, url }
  }

  return { name: domain, url: `https://${domain}` }
}
