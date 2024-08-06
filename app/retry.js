/**
 * Turns a regular function into a thunk for evaluation at a later time
 * For more information on thunks see https://en.wikipedia.org/wiki/Thunk#:~:text=In%20computer%20programming%2C%20a%20thunk,end%20of%20the%20other%20subroutine.
 * 
 * @param {Function} fn any function (sync or async) you wish to turn into a thunk
 * @param {ParamArray} an array of parameters to be used for the function
 * see here for more info on rest parameters https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
 * @returns 
 */
function thunkify(fn, ...rest){
  return function(cb) {
    rest.push(cb)
    return fn.apply(null, rest)
  }
}

const retry = async (fn, retriesLeft = 10, interval = 5000, exponential = false) => {
  try {
    return await fn()
  } catch (err) {
    if (retriesLeft > 0) {
      await new Promise(resolve => setTimeout(resolve, interval))
      return await retry(fn, retriesLeft - 1, exponential ? interval * 2 : interval, exponential)
    } else {
      throw err
    }
  }
}

module.exports = {
  retry,
  thunkify
}
