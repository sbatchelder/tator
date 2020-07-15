class FillTrack {
  constructor(videoDef, algoCanvas) {
    console.info("Processing = " + JSON.stringify(videoDef));
    this._width = videoDef.width;
    this._height = videoDef.height;
    this._activeLocalization = algoCanvas.activeLocalization;
    this._tracks = algoCanvas._data._trackDb;
    this._data = algoCanvas._data._dataByType;
    this._last = null;

    // Get the currently selected track.
    const track = this._tracks[this._activeLocalization.id];

    // Get localizations for this track.
    this._localizations = algoCanvas._data._dataByType
                          .get(this._activeLocalization.meta).filter(elem => {
      return this._tracks[elem.id].meta == track.meta;
    });

    // Sort localizations by frame.
    this._localizations.sort((left, right) => {left.frame - right.frame});
  }

  processFrame(frameIdx, frameData) {
    console.info("Processing frame " + frameIdx);
    if (this._activeLocalization.id in this._tracks) {

      // Retrieve the most recent localization in the track before this frame.
      let latest = null;
      for (const localization of this._localizations) {
        if (localization.frame <= frameIdx) {
          latest = localization;
        }
      }
     
      // If the track contains no localizations from before this frame, take no action.
      if (latest === null) {
        return;
      }

      // Convert frame data to a mat.
      const frame = cv.matFromArray(this._height, this._width, cv.CV_8UC4, frameData);
      
      if (latest.frame == frameIdx) {
        // If latest is for this current frame, set the mean shift ROI.
        console.info("Setting ROI with existing localization!");
        this._setRoi(latest, frame);
      } else {
        // If the latest is older than current frame, predict the new ROI.
        console.info("Predicting new localization!");
        this._predict(frame);
      }

      // Clean up.
      frame.delete();
    }
  }

  finalize() {
    console.info("Done algorithm");
  }

  _setRoi(latest, frame) {
  }

  _predict(frame) {
  }
}

// Eval won't store the 'Algo' class definition globally
// This is actually helpful, we just need a factory method to
// construct it
function algoFactory(videoDef, algoCanvas) {
  return new FillTrack(videoDef, algoCanvas);
}
