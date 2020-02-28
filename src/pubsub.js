import { PubSub } from 'apollo-server'

const HISTORY_ADDED = 'HISTORY_ADDED'
const WORLD_STATUS = 'WORLD_STATUS'

const pubsub = new PubSub()

export { pubsub, HISTORY_ADDED, WORLD_STATUS }
