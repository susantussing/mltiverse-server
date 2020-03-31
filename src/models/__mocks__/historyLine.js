const HistoryLine = jest.fn().mockImplementation(
  () => {
    return {
      line: 'default line',
      type: 'output',
      world: 'default world',
      save: jest.fn()
    }
  }
)

export default HistoryLine
