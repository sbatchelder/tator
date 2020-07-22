class FillTrack {
  constructor(videoDef, algoCanvas) {
    console.info("Processing = " + JSON.stringify(videoDef));
    this._project = algoCanvas.activeLocalization.project;
    this._mediaId = algoCanvas.activeLocalization.media;
    this._width = videoDef.width;
    this._height = videoDef.height;
    this._data = algoCanvas._data;
    this._dataTypes = algoCanvas._data._dataTypes;
    this._newLocalizations = [];

    // Get the currently selected track.
    this._track = algoCanvas._data._trackDb[algoCanvas.activeLocalization.id];

    // Get localizations that match the selected localization's type
    // #TODO There probably is a better way to do this (and the next step) instead
    //       of just grabbing everything.
    let selectedLocalizations = algoCanvas._data._dataByType
                          .get(algoCanvas.activeLocalization.meta);

    // With a list of localizations now curated, cycle through them and figure out
    // which localizations belong to the selected track
    this._localizations = [];
    for (const idx in selectedLocalizations) {
      let currentLocalization = selectedLocalizations[idx];
      if (algoCanvas._data._trackDb[currentLocalization.id]) {
        const sameTrackId = algoCanvas._data._trackDb[currentLocalization.id].id == this._track.id;
        if (sameTrackId) {
          this._localizations.push(currentLocalization);
        }
      }
    }

    // Sort localizations by frame.
    this._localizations.sort((left, right) => {left.frame - right.frame});

    // Setup the termination criteria, either 10 iteration or move by atleast 1 pt
    this._termCrit = new cv.TermCriteria(cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 10, 1);
  }

  processFrame(frameIdx, frameData) {
    console.info("Processing frame " + frameIdx);
    // Retrieve the most recent localization in the track before this frame.
    let latest = null;
    for (const localization of this._localizations) {
      if (localization.frame <= frameIdx) {
        if (latest) {
          if (localization.frame > latest.frame) {
            latest = localization;
          }
        }
        else {
          latest = localization;
        }
      }
    }

    // If the track contains no localizations from before this frame, take no action.
    if (latest === null) {
      return;
    }
    this._localization_attributes = latest.attributes;

    // Convert frame data to a mat.
    const frame = cv.matFromArray(this._height, this._width, cv.CV_8UC4, frameData);
    cv.flip(frame, frame, 0);

    if (latest.frame == frameIdx) {
      // If latest is for this current frame, set the mean shift ROI.
      console.info("Setting ROI with existing localization!");
      this._setRoi(latest, frame);
    } else {
      // If the latest is older than current frame, predict the new ROI.
      console.info("Predicting new localization!");
      this._predict(frame, frameIdx);
    }

    // Clean up.
    frame.delete();
    console.log("done processing frame");

    return null;
  }

  finalize() {
    console.info("Done algorithm");
    // Create new localizations.
    const promise = fetchRetry("/rest/Localizations/" + this._project, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this._newLocalizations),
    })
    .then(response => response.json())
    .then(data => {
      // Append new localizations to track.
      fetchRetry("/rest/State/" + this._track.id, {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({'localization_ids_add': data.id}),
      })
      .then(async () => {
        // Clean up.
        this._dst.delete();
        this._hsvVec.delete();
        this._roiHist.delete();
        this._hsv.delete();
        // Update data after a second.
        await new Promise(r => setTimeout(r, 1000));
        this._data.updateType(this._dataTypes[this._localizationType]);
        this._data.updateType(this._dataTypes[this._track.meta]);
      });
    });
    return promise;
  }

  _setRoi(latest, frame) {
    // Set the version and type.
    this._version = latest.version;
    this._localizationType = latest.meta;

    // Set location of window (flip around x/y)
    const x = Math.round(latest.x * this._width);
    const y = Math.round(latest.y * this._height);
    const w = Math.round(latest.width * this._width);
    const h = Math.round(latest.height * this._height);
    this._trackWindow = new cv.Rect(x, y, w, h);

    // set up the ROI for tracking
    let roi = frame.roi(this._trackWindow);
    let hsvRoi = new cv.Mat();
    cv.cvtColor(roi, hsvRoi, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsvRoi, hsvRoi, cv.COLOR_RGB2HSV);
    let mask = new cv.Mat();
    let lowScalar = new cv.Scalar(0, 10, 10);
    let highScalar = new cv.Scalar(180, 255, 255);
    let low = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), lowScalar);
    let high = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), highScalar);
    cv.inRange(hsvRoi, low, high, mask);
    this._roiHist = new cv.Mat();
    let hsvRoiVec = new cv.MatVector();
    hsvRoiVec.push_back(hsvRoi);
    cv.calcHist(hsvRoiVec, [0], mask, this._roiHist, [180], [0, 180]);
    cv.normalize(this._roiHist, this._roiHist, 0, 180, cv.NORM_MINMAX);

    // delete useless mats.
    roi.delete(); hsvRoi.delete(); mask.delete(); low.delete(); high.delete(); hsvRoiVec.delete();

    this._hsv = new cv.Mat(this._height, this._width, cv.CV_8UC3);
    this._dst = new cv.Mat();
    this._hsvVec = new cv.MatVector();
    this._hsvVec.push_back(this._hsv);
  }

  _predict(frame, frameIdx) {

    cv.cvtColor(frame, this._hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(this._hsv, this._hsv, cv.COLOR_RGB2HSV);
    cv.calcBackProject(this._hsvVec, [0], this._roiHist, this._dst, [0, 180], 1);

    // Apply meanshift to get the new location
    // and it also returns number of iterations meanShift took to converge,
    // which is useless in this demo.
    console.log(this._trackWindow);
    let trackBox = null;
    [trackBox, this._trackWindow] = cv.CamShift(this._dst, this._trackWindow, this._termCrit);
    console.log(this._trackWindow);
    console.log(trackBox);

    // Buffer the localization to be saved to platform.
    var newLocalization = {
      media_id: this._mediaId,
      type: Number(this._localizationType.split("_")[1]),
      x: this._trackWindow.x / this._width,
      y: this._trackWindow.y / this._height,
      width: this._trackWindow.width / this._width,
      height: this._trackWindow.height / this._height,
      frame: frameIdx,
      version: this._version,
    };

    newLocalization = {...newLocalization, ...this._localization_attributes};

    this._newLocalizations.push(newLocalization);

  }
}

// Eval won't store the 'Algo' class definition globally
// This is actually helpful, we just need a factory method to
// construct it
function algoFactory(videoDef, algoCanvas) {
  return new FillTrack(videoDef, algoCanvas);
}
