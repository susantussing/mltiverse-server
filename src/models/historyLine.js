import mongoose, { Schema } from 'mongoose'
import { connections } from '../telnetConnection'
import { pubsub, HISTORY_ADDED } from '../pubsub'

// The history lines collectively are the output log for each game and for some client messages
// to the user.  A "line" is not necessarily a single line; it may be multiple lines sent from the
// game server at the same time.
//
// TODO: 
// Ability to export history for a given period with and without line timestamps.
// Ability to cap lines at a reasonable level for display.
// Remove history when world is removed, but give option to download first?

const HistoryLineSchema = new Schema(
  {
    line: String,
    world: {
      type: Schema.Types.ObjectId,
      ref: 'World'
    },
    type: {
      type: String,
      enum: ['output', 'input', 'system']
    }
  },
  { timestamps: true }
)

// We pretty much always want these in created order.
HistoryLineSchema.index({ createdAt: 1 })

// Send the command to the world's telnet connection for new input lines.
// Ensures these both get done at the same time but allows it to be done by the
// GraphQL mutation from the client.
HistoryLineSchema.pre('save', async function () {
  if (this.type === 'input' && this.isNew) {
    connections[this.world].sendCommand(this.line)
  }

  this.wasNew = this.isNew // pass this on to the post-save, we can't do the rest until then
})

// Population makes sure that we have a real world and not just an ID.
// There's probably a better way to set up these relationships to make that more consistent.
HistoryLineSchema.post('save', async function () {
  await this.populate('world').execPopulate()

  if (this.wasNew) {
    // If this is the user's active tab, send the output.  Otherwise, update the unread count.
    if (this.world.current) {
      pubsub.publish(HISTORY_ADDED, { updateOutput: this })
    } else {
      this.world.unread += 1
      await this.world.save()
    }
  }
})

const HistoryLine = mongoose.model('HistoryLine', HistoryLineSchema)

export default HistoryLine
