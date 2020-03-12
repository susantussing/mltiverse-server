const HISTORY_ADDED = 'HISTORY_ADDED'
const WORLD_UPDATE = 'WORLD_UPDATE'

const pubsub = { publish: jest.fn() }

export { pubsub, HISTORY_ADDED, WORLD_UPDATE }
