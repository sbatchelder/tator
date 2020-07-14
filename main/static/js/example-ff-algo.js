class Algo {

  // notionally do something the video definition
  constructor(videoDef)
  {
    console.info("Processing = " + JSON.stringify(videoDef));
    this._last = null;
  }

  // This gets called once per frame
  processFrame(frameIdx, offscreenCanvas, gl)
  {
    if (frameIdx % 10 == 0)
    {
      let now = performance.now();
      if (this._last)
      {
        let fps = 10 / ((now-this._last)/1000);
        console.info(`Algo FPS = ${fps}`);
      }
      this._last = now;
    }
    console.info("Processing frame " + frameIdx)

    // Read back pixels into an array from the gl context
    var pixels = new Uint8Array(gl.drawingBufferWidth *
                                gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
                  gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    // pixels now contains the frame data

    // Can return a CustomEvent here to dispatch to higher level process
    return null;
  }

  // This get called afer the last frame is processed
  finalize()
  {
    console.info("Done algorithm");
  }
}

// Eval won't store the 'Algo' class definition globally
// This is actually helpful, we just need a factory method to
// construct it
function algoFactory(videoDef)
{
  return new Algo(videoDef);
}
