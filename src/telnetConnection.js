import ansi from 'anser'
import { TelnetSocket } from 'telnet-stream'
import { Socket } from 'net'
import HistoryLine from './models/historyLine'

export default class TelnetConnection {
  constructor (world) {
    this.world = world
    this.socket = new TelnetSocket(new Socket())
    this.host = world.host
    this.port = world.port

    this.socket.on('data', async data => {
      // Will create a new HistoryLine for this
      const split = data
        .toString()
        .replace(/\r\n$/, '')
        .split('\r\n')

      for await (const line of split) {
        const escapedString = ansi.escapeForHtml(line)
        const htmlString = ansi.ansiToHtml(escapedString, {
          use_classes: true
        })
        // console.log(htmlString);
        const historyLine = new HistoryLine({
          world: world._id,
          type: 'output',
          line: htmlString
        })
        await historyLine.save()
      }
    })

    this.socket.on('close', function () {
      console.log('Disconnected')
      const line = new HistoryLine({
        world,
        type: 'system',
        line: 'Disconnected.'
      })
      line.save()
      world.status = 'disconnected'
      world.save()
    })

    this.socket.on('connect', function () {
      console.log('Connected')
      const line = new HistoryLine({
        world,
        type: 'system',
        line: 'Connected.'
      })
      line.save()
      world.status = 'connected'
      world.save()
    })

    this.socket.on('error', function () {
      console.log('socket error')
    })
  }

  connect () {
    const params = {
      host: this.host,
      port: this.port
    }
    try {
      this.socket.connect(params)
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  disconnect () {
    try {
      this.socket.end()
      // this.socket.destroy();
    } catch (error) {
      console.error('Ending connection failed:', error)
    }
  }

  async sendCommand (command) {
    try {
      this.socket.write(`${command}\n`)
    } catch (error) {
      console.error('Write failed: ', error)
    }
  }
}

export const connections = {}
