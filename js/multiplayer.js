/*
 * @author
 * Jinyue Xia
 * UNC Charlotte
 */

function Multiplayer(videos) {
	this.getAdapter = function() {

	};
}

/* =============================================================================================================
                                        HTML5Multiplayer Object
================================================================================================================*/

// Object HTML5MultiPlayer constructor
function HTML5Multiplayer($playbutton, $slider, $volume) {
    this.videos = new Array();
    this.startTimes = new Array();
    this.endTimes = new Array();
    this.$playbutton = $playbutton;
    this.$slider = $slider;
    this.$volume = $volume;
    this.isDurationLong = false;
    this.masterVideoIndex = -1;
    // this.initPlayButtion();    // initialize the play/pause button
    //this.bindSlider();         // initialize the master sliders ???????
    this.initScrubber();
    this.volumeSlider();
    /*** private method ***/
}

// initialize the play/pause/replay buttion
HTML5Multiplayer.prototype.initPlayButtion = function () {
    var that = this;
    this.$playbutton.bind("click", function() {
        var buttonClass = $plybutton.attr("class");
        switch (buttonClass) {
            case "icon-play": 
                toggleHide();
                that.play();
                break;
            case "icon-pause":
                toggleShow();
                that.pause();
                break;
            case "icon-repeat":
                that.replay();
                break;
        }   
    });
};

// initialize master scrubber 
HTML5Multiplayer.prototype.initScrubber = function () {
    this.$slider.slider({
        orientation: "horizontal",
        range: "min",
        //animate: "fast",
        step: 0.01,
        value: 0,
        min: 0,
        max: 100
    });    
    this.$slider.find(".ui-slider-handle").css({
        width: 10,
        "margin-left": -5
    });
};

HTML5Multiplayer.prototype.setVideos = function (videos) {
    this.videos = videos;
};

HTML5Multiplayer.prototype.getVideos = function () {
    return this.videos;
};

HTML5Multiplayer.prototype.getMaster = function () {
    return this.videos[this.masterVideoIndex];
};

HTML5Multiplayer.prototype.changeDurationStatus = function (status) {
    this.isDurationLong = status;
};

// blind slider with slide event
HTML5Multiplayer.prototype.bindSlider = function () {
    var mVideo = this.getMaster().getVideoDOM();
    var that = this;
    var videos = this.videos;
    // bind slide event with the main scrubber
    this.$slider.on("slide", function(event, ui) {
        $(mVideo).unbind("timeupdate",  updateSlideHandler);
        for (var i = 0; i < videos.length; i++) {
                var video = videos[i].getVideoDOM();
                video.pause();
        }
        $playbuttonclass.removeClass().addClass("icon-play"); 
        var percent = ui.value / 100;  
        var skipTo = percent * mVideo.duration;
        $currentTimeDisplay.html(convertTimeToString(skipTo));
        that.seekTo(skipTo); 
    });
};

// initial master volume controller
HTML5Multiplayer.prototype.volumeSlider = function () {
    var videos = this.videos;
    var $tooltip = $("#volToolTip");
    this.$volume.slider({
        range: "min",
        min: 0,
        value: 100,
        start: function(event,ui) {
            $tooltip.fadeIn('fast');
        },
        //Slider Event
        slide: function(event, ui) { 
            //When the slider is sliding
            var value  = $(this).slider('value');
            var volume = $('.volume');
            $tooltip.css('left', value).text(ui.value); 
            
            for (var i = 0; i < videos.length; i++) {
                var video = videos[i].getVideoDOM();
                video.volume = ui.value / 100 * videos[i].getVolume();
                if (video.volume < 0) {
                    video.volume = 0;
                }
            }
            //Adjust the tooltip accordingly
            if(value <= 5) { 
                volume.css('background-position', '0 0');
            } 
            else if (value <= 25) {
                volume.css('background-position', '0 -25px');
            } 
            else if (value <= 75) {
                volume.css('background-position', '0 -50px');
                } 
            else {
                volume.css('background-position', '0 -75px');
            };
        },

        stop: function(event,ui) {
                $tooltip.fadeOut('fast');
        },
    });  //----> end of slider function

    this.$volume.find(".ui-slider-handle").css({
        width: 10,
        "margin-left": -5
    });
};

// play
HTML5Multiplayer.prototype.play = function () {
    var videos = this.videos;

    var videoSegCount = function () {
        for (var i = 0; i < videos.length; i++) {
               videos[i].segmentCounter();
           }
    };
    this.intID = window.setInterval(videoSegCount, 100);  // do the counter every 80 milliseconds

    if (videos.length === 0) {
        return;
    }
    $playbuttonclass.removeClass()
        .addClass("icon-pause");     
    var currSliderValue = this.$slider.slider("value");
    var currShowTime = this.masterDuration * currSliderValue / 100;
    if (this.isDurationLong) {
        for (var i = 0; i < videos.length; i++) {
            var video = videos[i].getVideoDOM();
            if ((currShowTime + videos[i].getStartTime()) >= videos[i].getEndTime()) {
                video.pause();
            } else {
                video.play();
            }
        }
    } else {
        for (var i = 0; i < videos.length; i++) {
            videos[i].getVideoDOM().play();
        }
    }

    var masterVideoObj = videos[this.masterVideoIndex];
    $(masterVideoObj.getVideoDOM()).bind("timeupdate", {
        that: this,
        masterVideoIndex: this.masterVideoIndex
    }, updateSlideHandler);
};

// pause
HTML5Multiplayer.prototype.pause = function () {
    var videos = this.videos;
    for (var i = 0; i < videos.length; i++) {
        videos[i].getVideoDOM().pause();
    }
    $playbuttonclass.removeClass()
                .addClass("icon-play");
    window.clearInterval(this.intID);
	console.log("the video's segments after pause are: " +  videos[0].segments);
//    for (var i = 0; i < videos.length; i++) {
//    	for (var j = 0; j < videos[i].segments.length; j++ )
//    		console.log(videos[i].segments);
//    }
};

// replay
HTML5Multiplayer.prototype.replay = function () {
    this.$slider.slider("value", 0);
    this.resetVideos();
    $playbuttonclass.removeClass()
                .addClass("icon-play");
    $currentTimeDisplay.html("00:00");
    window.clearInterval(this.intID);
	console.log("the video's segments after pause are: " + this.videos[0].segmentCheckers);
    // var videos = this.videos;
    // for (var i = 0; i < videos.length; i++) {
    //     for (var j = 0; j < videos[i].segments.length; j++ )
    //         videos[i].segmentCheckers[j] = false;
    // }
};

// a method to seek a specified time
HTML5Multiplayer.prototype.seekTo = function (skipTo) {
    var videos = this.videos;
    for (var i = 0; i < videos.length; i++) {
        var video = videos[i].getVideoDOM();
        var stopTo = videos[i].getStartTime() + skipTo; 
        if (stopTo >= videos[i].getEndTime()) {
            video.currentTime = videos[i].getEndTime();
        } else { 
            video.currentTime = stopTo; 
        }
    }
};

HTML5Multiplayer.prototype.changeVolume = function () {

};

// return active videos's starting times
HTML5Multiplayer.prototype.getSTimes = function() {
    var startTimes = new Array();
    for (var i = 0; i < this.videos.length; i++) {
        startTimes.push(this.videos[i].getStartTime());
    }
    return startTimes;
};

// return active videos's ending times
HTML5Multiplayer.prototype.getETimes = function () {
    var endTimes = new Array();
    for (var i = 0; i < this.videos.length; i++) {
        endTimes.push(this.videos[i].getEndTime);
    }
    return endTimes;
};

// reset the videos in this player to starting position 
HTML5Multiplayer.prototype.resetVideos = function() {
    for (var i = 0; i < this.videos.length; i++) {
        var video = this.videos[i].getVideoDOM();
        video.currentTime = this.videos[i].getStartTime();
    }
};

// public method to initialize dropped video
HTML5Multiplayer.prototype.initDropVideo = function(video) {
    video.volume = 0.5;
    var videoObj = new Video(video, 0, video.duration, 0.5);
    videoObj.initSegArray();		// initialize the video object's segments array
    // videoObj.videoId = video.id;
    videoObj.videoDOM = video;
    dropVideo(videoObj);
    this.videos.push(videoObj);
    var end = this.videos.length - 1;
    //this.startTimes[end] = 0;
    //this.endTimes[end] = video.duration;
    divIndex++;
    $(video).bind("ended", {
        videoObj: videoObj,
        html5player: this             // pass this object to the event listener
    }, capture);
    $(video).bind("volumechange", {
        html5player: this            // pass this object to the event listener
    }, capture);
    // $(video).bind("timeupdate", {
    //     videoObj: videoObj,
    //     html5player: this            // pass this object to the event listener
    // }, capture);
    if (this.videos[end].getEndTime() < this.masterDuration) {
        this.$slider.slider("value", 0);
    }
    this.setDuration();   
};

// set the duration for multiplayer and get the master video
HTML5Multiplayer.prototype.setDuration = function () {
    var diffs = new Array();
    var videos = this.videos;
    // var DOMVideos = this.DOMVideos;
    if (videos.length == 0) {
        $newDuration.html("0:00");
        return;
    }
    for (var i = 0; i < videos.length; i++) {
        var video = videos[i];
        diffs[i] = video.getEndTime() - video.getStartTime();
    }

    var minDiff = Math.min.apply(Math, diffs);
    var minIndex = diffs.indexOf(minDiff);
    var maxDiff = Math.max.apply(Math, diffs);
    var maxIndex = diffs.indexOf(maxDiff);

    if (this.isDurationLong) {
        this.masterDuration = maxDiff;
        this.masterVideoIndex = maxIndex;
    } else {
        this.masterDuration = minDiff;
        this.masterVideoIndex = minIndex;
    }
    $newDuration.html(convertTimeToString(this.masterDuration));
    
    var masterVideoIndex = this.masterVideoIndex;
    unbindUpdateTime(videos);
    if (this.masterVideoIndex != -1) {                // keep master slider updated with master video 
        $(videos[masterVideoIndex].getVideoDOM).bind("timeupdate", {
            that: this,
            masterVideoIndex: this.masterVideoIndex
        }, updateSlideHandler);   
        var currSliderValue = this.$slider.slider("value");
        var currShowTime = this.masterDuration * currSliderValue / 100;
        $currentTimeDisplay.html(convertTimeToString(currShowTime));
        // $newDuration.html(convertTimeToString(this.masterDuration));
    }
};

// update master slider
function updateSlideHandler(event) {
    var that = event.data.that;                 // a copy of this passed to this anonymous call
    updateScrubber(that);
}

// update master slider's scrubber's position
// wherever a video is dragged in or dropped out, the slider needs to be updated
function updateScrubber(player) {
    var videos = player.videos;
    var masterVideoObj = videos[player.masterVideoIndex];
    var mVideo = masterVideoObj.getVideoDOM();
    var msTime = masterVideoObj.getStartTime();
    // var mDuration = masterVideoObj.getDuration();
    var mDuration = masterVideoObj.getEndTime() - masterVideoObj.getStartTime();
    var currTime = mVideo.currentTime - msTime;
    if (currTime < 0.0001) {
        currTime = 0;
    }     

    $currentTimeDisplay.html(convertTimeToString(currTime));
    var percent = currTime / mDuration;
    player.$slider.slider("value", percent * 100);
    if (currTime > (mDuration+0.1)) {
        // console.log("currTime: " + currTime + " masterDuration" + masterDuration);
        for (var i = 0; i < videos.length; i++) {
            videos[i].getVideoDOM().pause();
        }
        toggleShow();    
        $playbuttonclass.removeClass()
                    .addClass("icon-repeat");
    }
    if (player.isDurationLong) {
        for (var i = 0; i < videos.length; i++) {
            if (videos[i].getVideoDOM().currentTime >= videos[i].getEndTime()) {
                videos[i].getVideoDOM().pause();
            }
        }
    }
}

// unbind updateTime event associated with all videos
function unbindUpdateTime(videos) {
    for (var i = 0; i < videos.length; i++) {
        $(videos[i].getVideoDOM()).unbind("timeupdate", updateSlideHandler);
    }
}

// capturing video's end and volumechange events
function capture(event) {              
    var html5player = event.data.html5player; // a copy of "this" passed to this anonymous call
    var videos = html5player.getVideos();
    var isDurationLong = html5player.isDurationLong;
    var masterVideo = html5player.getMaster().getVideoDOM();
    switch (event.type) {
        case "ended":
        	window.clearInterval(html5player.intID);	// also clear the counter interval
            // var videoObj = event.data.videoObj;
            // videoObj.lastSegmentCounter = segIndex; // reset the last segment counter
            if (!isDurationLong) {
                for (var i = 0; i < videos.length; i++) {
                    if (!videos[i].getVideoDOM().paused) {
                        videos[i].getVideoDOM().pause();
                    }
                }
                $playbuttonclass.removeClass()
                   .addClass("icon-repeat");
            }  
            else { 
                if (masterVideo.ended) {
                    $playbuttonclass.removeClass().addClass("icon-repeat");
                }
            }      
            break;
        case "volumechange":
            var videoId = getVideoId(event);
            var volslider = "#volSlider_" + videoId;
            $(volslider).slider("value", Math.round(event.currentTarget.volume*100));
            break;
        case "timeupdate":
            var videoObj = event.data.videoObj;
            var videoDOM = videoObj.getVideoDOM();
            // console.log(Math.floor((videoDOM.currentTime));
            // if (Math.round(Math.abs(videoDOM.currentTime - 0.05), -1) % 0.5 == 0) {
            var videoTimeMod = false;              // check whether video's currentTime is 0.5 base?
            if (videoDOM.currentTime < 10.0) {
                if (Math.floor((videoDOM.currentTime * 10)) % 5 == 0) {
                    videoTimeMod = true;
                }
            } else {
                if (Math.floor(videoDOM.currentTime) % 5 == 0) {
                    videoTimeMod = true;
                }
            }

            if (videoTimeMod) {
                var segIndex = videoObj.findSegmentIndex(Math.floor((videoDOM.currentTime * 10)) / 10);
                // videoObj.segmentCheckers[segIndex] = false;
                videoObj.lastSegmentCounter = segIndex;
                console.log("segment boundary crossed(last segment counted) at" + videoDOM.currentTime);
            }
            break;
    }
}

/* =============================================================================================================
                                        Video Object Definition
================================================================================================================*/

// Video Object Constructor 
