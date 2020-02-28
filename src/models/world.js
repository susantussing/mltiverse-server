import mongoose, { Schema } from 'mongoose'
import TelnetConnection, { connections } from '../telnetConnection'
import { pubsub, WORLD_STATUS } from '../pubsub'

const WorldSchema = new Schema({
  name: String,
  host: String,
  port: Number,
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'connecting', 'disconnecting'],
    default: 'disconnected'
  }
})

WorldSchema.methods.createConnection = function () {
  const connection = new TelnetConnection(this)
  connections[this._id] = connection
  return connection
}

WorldSchema.pre('save', function () {
  let connection
  if (this.isModified('status')) {
    if (this.status === 'connecting') {
      connection = this.createConnection()
      connection.connect()
    } else if (this.status === 'disconnecting') {
      connection = connections[this._id]
      connection.disconnect()
    }

    pubsub.publish(WORLD_STATUS, { worldStatus: this })
  }
})

const World = mongoose.model('World', WorldSchema)

export default World
