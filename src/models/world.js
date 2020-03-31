import mongoose, { Schema } from 'mongoose'
import TelnetConnection, { connections } from '../telnetConnection'
import { pubsub, WORLD_UPDATE } from '../pubsub'

// NOTES:  A "world" is one saved game connection and associated data about that connection.
// Worlds belong to and will be editable by users (once there are users).
// More than one world may connect to a given game, even for the same user.
//
// TODO:  Users to associate with.  Ability to save login credentials along with some kind of 
// big obvious warning about not reusing passwords that will be sent over plain text.

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

// Create an actual telnet connection to go with this world.
WorldSchema.methods.createConnection = function () {
  const connection = new TelnetConnection(this)
  connections[this._id] = connection
  return connection
}

// Before saving, handle all behavior that needs to be performed on save.
// Doing this before save because afterwards, there's no ability to tell what's changing.
// TODO: Restructure a bunch of this to make update publishing more consistent.
WorldSchema.pre('save', async function () {
  let connection
  if (this.isModified('status')) {
    if (this.status === 'connecting') {
      // Setting it to connecting triggers the connection, which then will set it to connected.
      connection = this.createConnection()
      connection.connect()
    } else if (this.status === 'disconnecting') {
      // And the reverse for disconnecting.
      connection = connections[this._id]
      connection.disconnect()
    } else {
      // Only publish the update to the websocket when we're done.
      pubsub.publish(WORLD_UPDATE, { worldUpdate: this })
    }
  }

  if (this.isModified('open')) {
    // Clear unread either if we're closing or opening the world.
    // Makes sure it's zero even if for some reason the server didn't shut down correctly.
    this.unread = 0

    if (this.open) {
      // When opening this window, auto-connect.
      // Eventually make this an option.
      connection = this.createConnection()
      connection.connect()
    } else {
      // When closing, disconnect the existing connection as long as it still exists.
      connection = connections[this._id]
      connection && connection.disconnect()
    }

    // Always send update to websocket to update client.
    pubsub.publish(WORLD_UPDATE, { worldUpdate: this })
  }

  if (this.isModified('current')) {
    if (this.current) {
      // mark others not current - temporary
      // eventually this will go away when there's a user document to store this info on
      await this.constructor.updateMany({ current: true }, { current: false })
      this.unread = 0
    }

    // pubsub.publish(WORLD_UPDATE, { worldUpdate: this })
  }

  if (this.isModified('unread') && !this.isModified('open')) {
    // If the unread changes at any time other than open/close, update the UI.
    pubsub.publish(WORLD_UPDATE, { worldUpdate: this })
  }
})

const World = mongoose.model('World', WorldSchema)

export default World
