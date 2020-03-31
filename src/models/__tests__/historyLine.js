import HistoryLine from '../historyLine'
import { pubsub } from '../../pubsub'
import mongoose from 'mongoose'
import World from '../world'

jest.mock('../../pubsub')

describe('HistoryLine', () => {
  let world
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost/muclient-test', { useNewUrlParser: true })
    world = await World.create({
      name: 'Test World',
      host: 'hostname',
      port: 1234
    })
  })

  beforeEach(() => {
    pubsub.publish.mockReset()
  })

  it('can create a line in history', async () => {
    const newLine = await HistoryLine.create({
      line: 'test',
      type: 'output',
      world: world
    })
    expect(newLine).toEqual(expect.objectContaining({
      line: 'test',
      type: 'output'
    }))
    expect(newLine).toHaveProperty('createdAt')
  })

  afterAll(async () => {
    await World.collection.deleteMany({})
    await HistoryLine.collection.deleteMany({})
    mongoose.disconnect()
  })
})
