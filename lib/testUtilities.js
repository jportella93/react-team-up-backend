// integrate in the end
const testSpeedListener = socket.on('testSpeed', (data) => {
  const ms = Date.now() - data.timeOfSend;
  console.log(`Travel time: ${ms}ms`)
  socket.emit('answerSpeed', ms)
})

//in the client
const testSpeed = () => {
  socket.emit('testSpeed', {
    timeOfSend: Date.now()
  });
}

socket.on('answerSpeed', (data) => {
  document.getElementById('span_speed-answer').innerHTML = `${data}ms`
})

// ----------------------------
