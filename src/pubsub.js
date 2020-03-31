import { PubSub } from 'apollo-server'

// TODO: Better names for these.
const HISTORY_ADDED = 'HISTORY_ADDED'
const WORLD_UPDATE = 'WORLD_UPDATE'

// Export the PubSub that everything will share to coordinate subscriptions.
const pubsub = new PubSub()

export { pubsub, HISTORY_ADDED, WORLD_UPDATE }
