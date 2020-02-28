import { composeWithMongoose } from 'graphql-compose-mongoose'
import { schemaComposer } from 'graphql-compose'
import World from './models/world'
import HistoryLine from './models/historyLine'
import { pubsub, HISTORY_ADDED, WORLD_STATUS } from './pubsub'

const customizationOptions = {}
const WorldTC = composeWithMongoose(World, customizationOptions)

schemaComposer.Query.addFields({
  worldById: WorldTC.getResolver('findById'),
  worldOne: WorldTC.getResolver('findOne'),
  worldMany: WorldTC.getResolver('findMany'),
  worldCount: WorldTC.getResolver('count'),
  worldPagination: WorldTC.getResolver('pagination')
})

schemaComposer.Mutation.addFields({
  worldCreateOne: WorldTC.getResolver('createOne'),
  worldUpdateById: WorldTC.getResolver('updateById'),
  worldRemoveById: WorldTC.getResolver('removeById')
})

const HistoryLineTC = composeWithMongoose(HistoryLine, customizationOptions)

schemaComposer.Query.addFields({
  historyLineById: HistoryLineTC.getResolver('findById'),
  historyLineOne: HistoryLineTC.getResolver('findOne'),
  historyLineMany: HistoryLineTC.getResolver('findMany'),
  historyLineCount: HistoryLineTC.getResolver('count'),
  historyLinePagination: HistoryLineTC.getResolver('pagination')
})

schemaComposer.Mutation.addFields({
  historyLineCreateOne: HistoryLineTC.getResolver('createOne')
})
schemaComposer.Subscription.addFields({
  updateOutput: {
    type: 'HistoryLine',
    subscribe: () => pubsub.asyncIterator([HISTORY_ADDED])
  },
  worldStatus: {
    type: 'World',
    subscribe: () => pubsub.asyncIterator([WORLD_STATUS])
  }
})

const graphqlSchema = schemaComposer.buildSchema()
export default graphqlSchema
