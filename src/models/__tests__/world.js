import World from '../world'
import mongoose from 'mongoose'
import TelnetConnection, { connections } from '../../telnetConnection'
import { pubsub } from '../../pubsub'

jest.mock('../../telnetConnection')
jest.mock('../../pubsub')

describe('World', () => {
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
    TelnetConnection.mockReset()
    pubsub.publish.mockReset()
  })

  it('can create a world and defaults are set', () => {
    expect(world).toEqual(expect.objectContaining({
      name: 'Test World',
      host: 'hostname',
      port: 1234,
      status: 'disconnected',
      open: false,
      current: false,
      unread: 0
    }))
  })

  it('can create a new TelnetConnection for the world', () => {
    const connection = world.createConnection()
    expect(connections[world._id] instanceof TelnetConnection).toBe(true)
    expect(connection instanceof TelnetConnection).toBe(true)
  })

  describe('pre-save hooks', () => {
    it('updates on status change', async () => {
      const connectionSpy = jest.spyOn(world, 'createConnection')
      world.status = 'connecting'
      await world.save()
      expect(connectionSpy).toHaveBeenCalled()
      expect(TelnetConnection.mock.instances[0].connect).toHaveBeenCalled()

      world.status = 'disconnecting'
      await world.save()
      expect(TelnetConnection.mock.instances[0].disconnect).toHaveBeenCalled()

      world.status = 'disconnected'
      await world.save()
      expect(pubsub.publish).toHaveBeenCalled()
    })

    it('updates when open/closed and when unread updated', async () => {
      const connectionSpy = jest.spyOn(world, 'createConnection')

      world.unread = 17
      await world.save()

      world.open = true
      await world.save()

      expect(world.unread).toBe(0) // clear unread both when opened and closed to be safe
      expect(connectionSpy).toHaveBeenCalled()
      expect(TelnetConnection.mock.instances[0].connect).toHaveBeenCalled()

      world.open = false
      await world.save()

      expect(TelnetConnection.mock.instances[0].disconnect).toHaveBeenCalled()

      expect(pubsub.publish).toHaveBeenCalledTimes(3)
    })
  })
  afterAll(async () => {
    await World.collection.deleteMany({})
    mongoose.disconnect()
  })
})
