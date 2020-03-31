import TelnetConnection from '../telnetConnection'
import HistoryLine from '../models/historyLine'

jest.mock('../models/world')

jest.mock('../models/historyLine', () => jest.fn())

const mockSave = jest.fn()

HistoryLine.mockImplementation(() => {
  return { save: mockSave }
})

describe('TelnetConnection', () => {
  let telnetConnection
  let world
  beforeEach(() => {
    world = {
      _id: 'worldId',
      name: 'Test World',
      host: 'hostname',
      port: 1234,
      save: jest.fn()
    }
    telnetConnection = new TelnetConnection(world)
  })

  it('can instantiate with the right values', () => {
    expect(telnetConnection.world).toBe(world)
    expect(telnetConnection.host).toBe(world.host)
    expect(telnetConnection.port).toBe(world.port)
  })

  it('creates and saves line when data is received on socket', async () => {
    telnetConnection.socket._socket.emit('data', 'test\r\ntest2\r\n')
    await expect(HistoryLine).toHaveBeenCalledWith({ line: 'test\r\ntest2', type: 'output', world: 'worldId' })
    await expect(mockSave).toHaveBeenCalled()
  })

  it('disconnects and sends disconnection update notice on socket close', () => {
    telnetConnection.socket._socket.emit('close')
    expect(HistoryLine).toHaveBeenCalledWith(expect.objectContaining({ line: 'Disconnected.', type: 'system' }))
    expect(world.status).toBe('disconnected')
    expect(world.save).toHaveBeenCalled()
  })

  it('sends connection update notice when socket connects', () => {
    telnetConnection.socket._socket.emit('connect')
    expect(HistoryLine).toHaveBeenCalledWith(expect.objectContaining({ line: 'Connected.', type: 'system' }))
    expect(world.status).toBe('connected')
    expect(world.save).toHaveBeenCalled()
  })

  it('sends error to console on socket error', () => {
    // replace implementation to not clutter log with error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { })
    telnetConnection.socket._socket.emit('error')
    expect(spy).toHaveBeenCalled()
  })

  it('connects to socket on connection', () => {
    const mockConnect = jest.fn()
    telnetConnection.socket.connect = mockConnect
    telnetConnection.connect()
    expect(mockConnect).toHaveBeenCalledWith({ host: 'hostname', port: 1234 })
  })

  it('ends socket on disconnect', () => {
    const mockEnd = jest.fn()
    telnetConnection.socket.end = mockEnd
    telnetConnection.disconnect()
    expect(mockEnd).toHaveBeenCalled()
  })

  it('writes to socket on sending a command', () => {
    const mockWrite = jest.fn()
    telnetConnection.socket.write = mockWrite
    telnetConnection.sendCommand('test')
    expect(mockWrite).toHaveBeenCalledWith('test\n')
  })
})
