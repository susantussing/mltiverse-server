import { PubSub } from 'apollo-server'

const HISTORY_ADDED = 'HISTORY_ADDED'
const WORLD_UPDATE = 'WORLD_UPDATE'

const pubsub = new PubSub()

export { pubsub, HISTORY_ADDED, WORLD_UPDATE }
