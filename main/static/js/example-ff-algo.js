class Algo {

  // notionally do something the video definition
  constructor(videoDef)
  {
    console.info("Processing = " + JSON.stringify(videoDef));
    this._last = null;
  }

  // This gets called once per frame
  processFrame(frameIdx, frameData)
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
