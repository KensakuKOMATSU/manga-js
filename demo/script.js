const getSourceStream = async () => {
  return await navigator
    .mediaDevices
    .getUserMedia({video: true, audio: false})
    .catch(err => { throw err })
}

let manga // for easy debugging, we set this variable as global one.
document.querySelector('#start-btn').addEventListener('click', async () => {
  const peer = new Peer({key: '18e81fae-027a-4ca9-a9e8-17d348a917f5'})

  manga = new Manga()
  const stream = await getSourceStream()
  await manga.start( stream )

  document.querySelector('#local-video').srcObject = manga.stream

  const mode = 'mesh' // 'sfu'

  peer.on('open', id => {
    console.log('connected to sig server', id)
    const room = peer.joinRoom('testroom', {
      mode,
      stream: manga.stream,
    });

    room.on('open', () => {
      console.log('room opened')
    });

    room.on('peerJoin', id => {
      console.log(`peer: ${id} joined room`)
    })

    room.on('stream', stream => {
      console.log( stream )
      const v = document.querySelector('#remote-video')
      v.srcObject = stream
    })
  })
}, false)
