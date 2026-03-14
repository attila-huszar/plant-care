import { fileURLToPath } from 'node:url'

export const emailLogoFilename = 'plant-care.png'
export const emailLogoFilePath = fileURLToPath(
  new URL(`../resources/images/${emailLogoFilename}`, import.meta.url),
)
export const emailLogoMimeType = 'image/png'
export const emailLogoContentId = 'plant-care-cid'
