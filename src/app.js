import { ApolloServer } from 'apollo-server-express'
import { createServer } from 'http'
import mongoose from 'mongoose'
import World from './models/world'
import graphqlSchema from './graphqlSchema'
import seed from './utils/seed'
import express from 'express'

mongoose.connect('mongodb://localhost/muclient', { useNewUrlParser: true })
const db = mongoose.connection

db.on('error', console.error.bind('console', 'MongoDB connection error:'))

db.once('open', async () => {
  await seed()
  const world = await World.findOne({ name: 'Test' })
  world.status = 'disconnected'
  await world.save()

  const PORT = 5000
  const apolloServer = new ApolloServer({ schema: graphqlSchema, playground: true, introspection: true })
  const app = express()
  apolloServer.applyMiddleware({ app })
  const httpServer = createServer(app)
  apolloServer.installSubscriptionHandlers(httpServer)

  httpServer.listen({ port: PORT }, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`)
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${apolloServer.subscriptionsPath}`)
  })

  const connection = world.createConnection()
  connection.connect()

  process.on('exit', () => {
    httpServer.close()
  })
})
