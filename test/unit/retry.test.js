const { retry, thunkify } = require('../../app/retry')
let mockFunction

describe('retry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFunction = jest.fn().mockResolvedValue('success')
  })

  test('calls function', async () => {
    await retry(mockFunction)
    expect(mockFunction).toHaveBeenCalled()
  })

  test('calls function once if successful', async () => {
    await retry(mockFunction)
    expect(mockFunction).toHaveBeenCalledTimes(1)
  })

  test('retries function call once if fails', async () => {
    mockFunction.mockRejectedValueOnce('error')
    mockFunction.mockResolvedValueOnce('success')
    await retry(mockFunction)
    expect(mockFunction).toHaveBeenCalledTimes(2)
  })

  test('retries function call up to maximum retries', async () => {
    mockFunction.mockRejectedValue('error')
    try {
      await retry(mockFunction, 1)
    } catch {}
    expect(mockFunction).toHaveBeenCalledTimes(2)
  })
})

function syncThunkable(a,b){
  return a+b
}

async function asyncThunkable(a,b){
  return a+b
}

describe ('thunkify', () => {
  it('should create a synchronous thunk', () => {
    const thunk = thunkify(syncThunkable, 2, 2)
    expect(typeof thunk).toEqual('function')
    expect(thunk()).toEqual(4)
  })
  it('should create an asynchronous thunk', async () => {
    const thunk = thunkify(asyncThunkable, 2, 2)
    expect(typeof thunk).toEqual('function')
    expect(await thunk()).toEqual(4)
  })
})
