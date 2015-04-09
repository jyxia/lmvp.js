/* =============================================================================================================
                                        Video Object Definition
================================================================================================================*/

// Video Object Constructor 
function Video(videoDOM, startTime, endTime, sVolume) {
    // this.positionId = positionId;
    this.videoDOM = videoDOM;
    this.startTime = startTime;
    this.endTime = endTime;
    this.sVolume = sVolume;
}

// initialize one array for videos segments based on 0.5 seconds
// one array is used as a counter for how many times of a segment has been played
Video.prototype.initSegArray = function () {
    var video_duration = this.videoDOM.duration();
    var duration_integer = Math.floor(video_duration); 
    var duration_decimal = video_duration - duration_integer;
    var segmentLength = 0;
    if (duration_decimal == 0) {
        segmentLength = 2 * duration_integer;
    } else if (duration_decimal > 0 && duration_decimal <= 0.5) {
        segmentLength = 2 * duration_integer + 1;
    } else {
        segmentLength = 2 * duration_integer + 2;
    }
    
    // this array is used to track how many times this segment is played.
    // the segment is 0.5 seconds based.
    this.segments = [];
    // last segment counter means which segment was counted, -1 means no segment is counted
    this.lastSegmentCounter = -1;

    for (var i = 0; i < segmentLength; i++) {
        this.segments[i] = 0;               // this is for play counter
        // this.segmentCheckers[i] = false;    // this is for checking ith segment has been incremented or or not
        // this.segmentBounaryCheckers = false;
    }
    // console.log("the video's segments are: " + segmentLength);  // testing
};


// counter for video segments
Video.prototype.segmentCounter = function () {
    var segIndex = this.findSegmentIndex(this.videoDOM.currentTime());
    
    // if current segment index is same as last counted segment index, return
    if (segIndex == this.lastSegmentCounter) {
        return;
    }

    var segmentPlayCounts = this.segments[segIndex]++;
    this.lastSegmentCounter = segIndex;
    // var videoId = parseInt(this.videoDOM.id.slice(-1));
    var videoId = this.getDivId();
    var pb = "#" + videoId + "_pb_" + segIndex;
    var $pb = $(pb); 

    // var norms = normalize(this.segments);
    // var percent = norms[segIndex];
    
    var percent = this.segments[segIndex] / this.getHighestSeg();
    // var color = this.getDisplayColor(percent);
    var color = this.getDisplayColorByCount(this.segments[segIndex]);
    $pb.css({
        "background-color": color
    });

    // console.log(segIndex + "th div color is: " + color + " and secgemtns is: " + segments); // testing s
};

// given the video's currentTime, find what segment it is 
Video.prototype.findSegmentIndex = function (currTime) {
	var index = 0;
	var time_integer = Math.floor(currTime);
	var time_decimal = currTime - time_integer;
	if (time_decimal > 0.0 && time_decimal <= 0.5) {
		index = time_integer * 2;
	} else if (time_decimal > 0.5 && time_decimal <= 1) {
		index = time_integer * 2 + 1;
	}
	
	return index;
};

// to display heatmap color with d3 and colorbrewer, the color level depends on
// the views percentage of the highest view
Video.prototype.getDisplayColor = function(percent) {
    var color = d3.scale.ordinal()
                    .domain([ "1TH", "2ND", "3RD", "4TH",
                     "5TH", "6TH", "7TH", "8TH", "9TH"])
                    .range(colorbrewer.YlOrRd[9]);
    var returnColor; 
    switch (true) {
        case percent >= 0 && percent < (1/9):
            returnColor = color("1TH");
            break;
        case percent >= (1/9) && percent < (2/9):
            returnColor = color("2ND");
            break;
        case percent >= (2/9) && percent < (3/9):
            returnColor = color("3RD");
            break;
        case percent >= (3/9) && percent < (4/9):
            returnColor = color("4TH");
            break;
        case percent >= (4/9) && percent < (5/9):
            returnColor = color("5TH");
            break;  
        case percent >= (5/9) && percent < (6/9):
            returnColor = color("6TH");
            break; 
        case percent >= (6/9) && percent < (7/9):
            returnColor = color("7TH");
            break;
        case percent >= (7/9) && percent < (8/9):
            returnColor = color("8TH");
            break;
        case percent >= (8/9) && percent <= 1:
            returnColor = color("9TH");
            break;
    }

    return returnColor;
}

// to display heatmap color with d3 color, the color level depends on
// the view counts, every count increment, color darken by 5 degree
Video.prototype.getDisplayColorByCount = function(count) {
    var returnColor;
    var MAX = 100;
    var color = d3.scale.linear()
                .domain([0, MAX])
                .range(["hsl(0,95%,90%)", "hsl(0,100%,25%)"]);

    var colors = [];
    for (var i = 0; i < MAX; i++) {
        colors[i] = color(i);
    }

    if (count > colors.length) {
        return color(colors.length - 1);
    }

    for (var j = 0; j < colors.length; j++) {
        if (j == (count * 5)) {
            returnColor = colors[j];
        }
    }

    return returnColor;
}

// depreated
Video.prototype.getDisplayColorBySegCount = function(segmentPlayCounts) {
    //244,128,0
    var initcolor = "rbg(204,204,255)";
    var aftercolor;
    switch (true) {
        case segmentPlayCounts >= 0 && segmentPlayCounts < 6:
            initcolor = "rbg(204,204,255)";
            aftercolor = shadeRGBColor(initcolor, segmentPlayCounts * (-0.1));
            break;
        case segmentPlayCounts >= 6 && segmentPlayCounts < 12:
            initcolor = "rbg(255,204,204)";
            aftercolor = shadeRGBColor(initcolor, (segmentPlayCounts-6) * (-0.1));
            break;
        case segmentPlayCounts >= 12 && segmentPlayCounts < 18:
            initcolor = "rbg(63,131,163)";
            aftercolor = shadeRGBColor(initcolor, (segmentPlayCounts-12) * (-0.1));
            break;
        case segmentPlayCounts >= 18 && segmentPlayCounts < 24:
            initcolor = "rbg(255,0,0)";
            aftercolor = shadeRGBColor(initcolor, (segmentPlayCounts-16) * (-0.1));
            break;
    }
}

// get video object's DOM object
Video.prototype.getVideoDOM = function () {
    return this.videoDOM;
};

Video.prototype.getCurrTime = function () {
    return this.videoDOM.currTime();
};

Video.prototype.setStartAndEndTimes = function(sTime, eTimes) {
    this.startTime = sTime;
    this.endTime = eTime;
};

Video.prototype.setDivId = function(id) {
    this.divID = id;
};

Video.prototype.getDivId = function(id) {
    return this.divID;
};

Video.prototype.setThumbnailURL = function (url) {
    this.thumbnailURL = url;
}

Video.prototype.getStartTime = function() {
    return this.startTime;
};

Video.prototype.getEndTime = function() {
    return this.endTime;
};

Video.prototype.getDuration = function () {
    return this.videoDOM.duration();
};

Video.prototype.getVolume = function () {
    return this.videoDOM.volume();
};

Video.prototype.getVideoId = function () {
    return this.videoDOM.id;
};

Video.prototype.getCurrentTime = function() {
    return this.videoDOM.currentTime();
};


// make this Video object JSON stringfiable
Video.prototype.toJSONObj = function() {
    var videoJSONObj = {
        "videoId" : this.getDivId(),
        "currTime" : this.getCurrentTime(),
        "startTime" : this.getStartTime(),
        "endTime" : this.getEndTime(),
        "startVolume" : this.sVolume,
        "vol" : this.getVolume(),
        "duration" : this.getDuration(),
        "segments" : this.segments
    };

    return videoJSONObj;
};


// get highest view segment
Video.prototype.getHighestSeg = function () {
    var max = Math.max.apply(null, this.segments);
    if (max < 10) {
        max = 10;
    }

    return max;
}


function UserMainEvent(actItem, currTime, duration, sysTime) {
	this.actItem = actItem;
	this.currTime = currTime;
	this.duration = duration;
	this.sysTime = sysTime;
}

function IndSliderEvent(actItem, action, videoId, sTime, eTime, sysTime) {
    this.actItem = actItem;
    this.action = action;
    this.videoId = videoId;
    this.sTime = sTime;
    this.eTime = eTime;
    this.sysTime = sysTime;
}

function MasterSliderEvent(actItem, action, sliderTime, sysTime) {
    this.actItem = actItem;
    this.action = action;
    this.sliderTime = sliderTime;
    this.sysTime = sysTime;
}

function Multiplayer(play, slider, volume, videos) {
    this.videos = videos;
    this.play = function () {
        playVideo();
    };
    this.pause = function() {
        
    };
}

function sendMainEvents (mainEvents, rVideos, lVideos) {
	$.get("CollectInfo", {"mainEvents": JSON.stringify(mainEvents),  
    	"rightVideos": JSON.stringify(rightVideos), "leftVideos": JSON.stringify(leftVideos)});
	
	$.get("CollectInfo", {"isEvents": JSON.stringify(isEvents),  
    	"rightVideos": JSON.stringify(rightVideos), "leftVideos": JSON.stringify(leftVideos)});
	
	$.get("CollectInfo", {"mSliderEvents": JSON.stringify(mainSliderEvents), 
	    	"rightVideos": JSON.stringify(rightVideos), "leftVideos": JSON.stringify(leftVideos)});
}
