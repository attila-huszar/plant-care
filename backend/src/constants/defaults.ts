import { fileURLToPath } from 'node:url'

export const emailLogoFilename = 'plant-care.svg'
export const emailLogoFilePath = fileURLToPath(
  new URL(`../resources/images/${emailLogoFilename}`, import.meta.url),
)
export const emailLogoMimeType = 'image/svg+xml'
export const emailLogoContentId = 'plant-care-cid'
