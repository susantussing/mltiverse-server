import mongoose, { Schema } from 'mongoose'
import TelnetConnection, { connections } from '../telnetConnection'
import { pubsub, WORLD_UPDATE } from '../pubsub'

const WorldSchema = new Schema({
  name: String,
  host: String,
  port: Number,
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'connecting', 'disconnecting'],
    default: 'disconnected'
  },
  open: {
    type: Boolean,
    default: false
  },
  current: {
    type: Boolean,
    default: false
  },
  unread: {
    type: Number,
    default: 0
  }
})

WorldSchema.methods.createConnection = function () {
  const connection = new TelnetConnection(this)
  connections[this._id] = connection
  return connection
}

WorldSchema.pre('save', async function () {
  let connection
  if (this.isModified('status')) {
    if (this.status === 'connecting') {
      connection = this.createConnection()
      connection.connect()
    } else if (this.status === 'disconnecting') {
      connection = connections[this._id]
      connection.disconnect()
    } else {
      pubsub.publish(WORLD_UPDATE, { worldUpdate: this })
    }
  }

  if (this.isModified('open') && this.open === false) {
    this.unread = 0
    connection = connections[this._id]
    connection.disconnect()
    pubsub.publish(WORLD_UPDATE, { worldUpdate: this })
  }

  if (this.isModified('current') && this.current) {
    // mark others not current, eventually will filter for user's own worlds only
    await this.constructor.updateMany({ current: true }, { current: false })
    this.unread = 0
    pubsub.publish(WORLD_UPDATE, { worldUpdate: this })
  }

  if (this.isModified('unread')) {
    pubsub.publish(WORLD_UPDATE, { worldUpdate: this })
  }
})

const World = mongoose.model('World', WorldSchema)

export default World
