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
  if (this.type === 'input') {
    connections[this.world].sendCommand(this.line)
  }
})

HistoryLineSchema.post('save', async function () {
  console.log(this.line)
  pubsub.publish(HISTORY_ADDED, { updateOutput: this })
})

const HistoryLine = mongoose.model('HistoryLine', HistoryLineSchema)

export default HistoryLine
