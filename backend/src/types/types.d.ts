type WithoutTS<T> = Omit<T, 'createdAt' | 'updatedAt'>

declare module '*.mjml' {
  const content: string
  export default content
}
