import World from '../models/world'

export default async () => {
  await World.collection.deleteMany({})
  await World.create({
    name: 'Test',
    host: 'localhost',
    port: '2860',
    status: 'disconnected',
    open: true
  })
}
