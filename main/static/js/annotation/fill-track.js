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
    // hardcode the initial location of window
    const x = Math.round(latest.x * this._width);
    const y = Math.round(latest.y * this._height);
    const w = Math.round(latest.width * this._width);
    const h = Math.round(latest.height * this._height);
    let trackWindow = new cv.Rect(x, y, w, h);

    // set up the ROI for tracking
    let roi = frame.roi(trackWindow);
    let hsvRoi = new cv.Mat();
    cv.cvtColor(roi, hsvRoi, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsvRoi, hsvRoi, cv.COLOR_RGB2HSV);
    let mask = new cv.Mat();
    let lowScalar = new cv.Scalar(30, 30, 0);
    let highScalar = new cv.Scalar(180, 180, 180);
    let low = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), lowScalar);
    let high = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), highScalar);
    cv.inRange(hsvRoi, low, high, mask);
    let roiHist = new cv.Mat();
    let hsvRoiVec = new cv.MatVector();
    hsvRoiVec.push_back(hsvRoi);
    cv.calcHist(hsvRoiVec, [0], mask, roiHist, [180], [0, 180]);
    cv.normalize(roiHist, roiHist, 0, 255, cv.NORM_MINMAX);

    // delete useless mats.
    roi.delete(); hsvRoi.delete(); mask.delete(); low.delete(); high.delete(); hsvRoiVec.delete();

    // Setup the termination criteria, either 10 iteration or move by atleast 1 pt
    let termCrit = new cv.TermCriteria(cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 10, 1);

    this._hsv = new cv.Mat(this._height, this._width, cv.CV_8UC3);
    this._dst = new cv.Mat();
    this._hsvVec = new cv.MatVector();
    this._hsvVec.push_back(this._hsv);
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
