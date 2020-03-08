import mongoose, { Schema } from 'mongoose'
import { connections } from '../telnetConnection'
import { pubsub, HISTORY_ADDED } from '../pubsub'

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

HistoryLineSchema.index({ createdAt: 1 })

HistoryLineSchema.pre('save', async function () {
  if (this.type === 'input' && this.isNew) {
    connections[this.world].sendCommand(this.line)
  }

  this.wasNew = this.isNew
})

HistoryLineSchema.post('save', async function () {
  await this.populate('world').execPopulate()

  if (this.wasNew) {
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
