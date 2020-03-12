import { pubsub } from '../pubsub'
import { PubSub } from 'apollo-server'

describe('pubsub', () => {
    it('returns a PubSub instance', () => {
        expect(pubsub instanceof PubSub).toBe(true)
    })
})