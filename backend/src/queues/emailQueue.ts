import { Queue } from 'bullmq'
import { env } from '@/config'
import { QUEUE } from '@/constants'

let queue: Queue | null = null

export function getEmailQueue(): Queue {
  if (queue) return queue

  const parsedUrl = new URL(env.redisUrl)

  queue = new Queue(QUEUE.EMAIL.NAME, {
    connection: {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port),
      maxRetriesPerRequest: null,
    },
  })

  return queue
}
