/**
 * The node:util package has a method called promisify
 * But this method requires that the original function has a callback
 * This helper methods is for promisifying functions that do not have a callback as their last argument
 *
 * @param {*} f The function to be 'Promisified'
 * @returns Async function
 */
function promisify (f) {
  return function (...args) { // return a wrapper-function (*)
    return new Promise((resolve, reject) => {
      try {
        resolve(f.call(this, ...args)) // call the original function)
      } catch (e) {
        reject(e)
      }
    })
  }
}

module.exports = promisify
