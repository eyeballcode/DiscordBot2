const fs = require('fs')

module.exports = class AudioQueue {

  constructor(channel) {
    this.queue = []
    this.currentlyPlaying = null
    this.channel = channel
  }

  schedulePlay(file) {
    this.queue.push(file)
    this.checkPlay()
  }

  play(file) {
    return new Promise(resolve => {
      let dispatcher = this.channel.play(file)
      this.currentlyPlaying = dispatcher

      dispatcher.on('finish', () => {
        fs.unlink(file, e => {})

        setTimeout(() => {
          this.currentlyPlaying = null
          this.checkPlay()
        }, 500)
        resolve()
      })
    })
  }

  checkPlay() {
    if (!this.currentlyPlaying && this.queue.length) {
      let next = this.queue.shift()
      this.play(next)
    }
  }

  async stop() {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.pause()
    }
    this.currentlyPlaying = null
    this.queue = []
  }
}
