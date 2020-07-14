function algo_init(video_def)
{
  console.info("Processing = " + JSON.stringify(video_def));
}

function algo_process_frame(frame_idx, offscreen_canvas, gl)
{
  console.info("Processing frame " + frame_idx)

  // Read back pixels into an array from the gl context
  var pixels = new Uint8Array(gl.drawingBufferWidth *
                              gl.drawingBufferHeight * 4);
  gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
                gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  // pixels now contains the frame data
}

function algo_finalize()
{
  console.info("Done algorithm");
}
