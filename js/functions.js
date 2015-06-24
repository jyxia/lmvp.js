/*
 * @author
 * Jinyue Xia
 * UNC Charlotte
 */

// var videoLib = new Array();  // an array contains all available videos in the left nav, global variable.
var $newDuration = $("#duration_display");
var $currentTimeDisplay = $("#current_time_display");
var $timer = $(".time_slider");
var $scrubber = $("scrubber");
var $playbutton = $("#playbutton"); 
var $playbuttonclass = $playbutton.children("i");
var $volMainSlider = $("#volumeslider");
var $previewImg = $(".videoprev");
var $dropzone = $("#dropzone");
// var isDurationLong = false;
var mvplayer = new MVPlayer($playbutton, $timer, $volMainSlider);

// play button status, used for database
var PLAY = 0;
var PAUSE = 1;
var REPLAY = 2;
var SLIDERSTART = 3;
var SLIDERSTOP = 4;

$(document).ready(function () {
    var $videos = $(".galleryImg");
    $videos.each(function(i) {
        $(this).bind("dblclick", dbclickVideo);
    });
    mvplayer.initCanvas($previewImg, $dropzone, $playbutton);

    //saveQtip($("#saveState"));
    //retrieveQtip($("#retrieveState"));
    // $(".video_player").myPlayer(mvplayer);
});

// bind play/pause/replay with the play button
 /* $playbutton.bind("click", function() {
    var buttonClass = $playbuttonclass.attr("class");
    var textContent = null;
    switch (buttonClass) {
        case "icon-play": 
            toggleHide();
            textContent = ">";
            mvplayer.play();
            break;
        case "icon-pause":
            textContent = "||";
            toggleShow();
            mvplayer.pause();
            break;
        case "icon-repeat":
            textContent = "R";
            mvplayer.replay();
            break;
    }  
     
    var userEvent = new UserMainEvent();
    userEvent.actItem = textContent;
    userEvent.currTime = $currentTimeDisplay.html();
    userEvent.duration = $newDuration.html();
    // userEvent.sysTime = getSysTime();
    userEvent.sysTime = getStandardTime();
    console.log("clickItem: " + userEvent.actItem + " currScrubberTime: " + userEvent.currTime
        + " duration: " + userEvent.duration + " sysTime: " + userEvent.sysTime);
    var mainEvents = new Array();
    mainEvents.push(userEvent);
    var rightVideos = saveRight();
    var leftVideos = saveLeft();
    $.get("CollectInfo", {"mainEvents": JSON.stringify(mainEvents),  
        "rightVideos": JSON.stringify(rightVideos), "leftVideos": JSON.stringify(leftVideos)});
}); */

// double click video, video goes to right, same function as drop video
function dbclickVideo (event) {
    console.log(event.currentTarget);
    mvplayer.dropVideo($(event.currentTarget));
    // mvplayer.bindSlider();
    mvplayer.pause();
}

// get current event target video's id
// this id is the index in the original video library 
function getVideoId(event) {
    var id = -1;
    for (var i = 0; i < videoLib.length; i++) {
        if (event.currentTarget == videoLib[i]) {
            id = i;
            break;
        }
    }
    return id;
}

// initialize the first slider for displaying progress purpose
function initProgressSlider($slider, videoObj) {
    var slider = $slider.slider({
        orientation: "horizontal",
        range: "min",
        disabled: true,
        min: 0,
        max: 100,
        value: videoObj.currTime * 100 / videoObj.duration
    });
    slider.find(".ui-slider-handle").css({
        width: 5,
        "margin-left": -2.5
    });
}

// initialize individual slider(2nd slider) for each viedo
// with input slider #id
function init2ndSlider($slider, videoObj) {
    var slider = $slider.slider({
        range: true,
        min: 0,
        max: 100,
        values: [videoObj.startTime*100/videoObj.getDuration(), 
                    videoObj.endTime*100/videoObj.getDuration()],
        slide: function(event, ui) {
            //console.log(ui.values[0]);
            //console.log(ui.values[1]);
            //console.log(ui.value);
            var video = videoObj.videoDOM;
            var sliderId = $slider.attr("id");
            var i = parseInt(sliderId.slice(-1)) - 1;
            setVideoPosition(ui.values[0], ui.value, videoObj);
            videoObj.startTime = video.duration() * ui.values[0] / 100;
            videoObj.endTime = video.duration() * ui.values[1] / 100;
            var showTime = convertTimeToString(videoObj.startTime);  
            // console.log("new time is: " + showTime); // for testing
            var td_set_play = "#td_set_info_" + (i+1);  // update display time on the right
            $(td_set_play).html("&nbsp" + showTime);
            mvplayer.$slider.slider("value", 0);
            mvplayer.setDuration();
            //currentTimeDisplay.innerHTML = "00:00";
        },
        start: function(event, ui) {
        	var sliderId = $slider.attr("id");
            var i = parseInt(sliderId.slice(-1));
            var actItem = event.currentTarget.id;
            var action = SLIDERSTART;
            var videoId = "video_" + i;
            var video = videoObj.videoDOM;
            var sTime = videoObj.getStartTime();
            var eTime = videoObj.getEndTime();
            var systime = getStandardTime();
            console.log("indSlider " + actItem +
                " action: " + action + " video: " + videoId
                + " from: " + sTime + " to: " + eTime
                + " systime: " + systime);
            var isEvent = new IndSliderEvent(actItem, action, videoId, sTime, eTime, systime);
            var isEvents = new Array();
            isEvents.push(isEvent);
            // var rightVideos = saveRight(mvplayer);
            // var leftVideos = saveLeft();
            // $.get("CollectInfo", {"isEvents": JSON.stringify(isEvents),  
            // 	"rightVideos": JSON.stringify(rightVideos), "leftVideos": JSON.stringify(leftVideos)});
        },
        stop: function(event, ui) {
        	var sliderId = $slider.attr("id");
            var i = parseInt(sliderId.slice(-1));
            var actItem = sliderId;
            var action = SLIDERSTOP;
            var videoId = "video_" + i;
            var video = videoObj.videoDOM;
            var sTime = videoObj.getStartTime();
            var eTime = videoObj.getEndTime();
            var systime = getStandardTime();
            console.log("indSlider " + actItem +
                " action: " + action + " video: " + videoId
                + " from: " + sTime + " to: " + eTime
                + " systime: " + systime);
            var isEvent = new IndSliderEvent(actItem, action, videoId, sTime, eTime, systime);
            var isEvents = new Array();
            isEvents.push(isEvent);
            // var rightVideos = saveRight(mvplayer);
            // var leftVideos = saveLeft();
            // $.get("CollectInfo", {"isEvents": JSON.stringify(isEvents),  
            // 	"rightVideos": JSON.stringify(rightVideos), "leftVideos": JSON.stringify(leftVideos)});
        }
    });
    slider.find(".ui-slider-handle").css({
        width: 5,
        "margin-left": -2.5
    });
}

// display volume slider, 3rd slider
function initDisVolSlider($slider, videoObj) {
    var slider = $slider.slider({
        orientation: "horizontal",
        disabled: true,
        range: "min",
        step: 0.01,
        min: 0,
        max: 100,
        value: videoObj.getVolume() * 100,
    });
    slider.find(".ui-slider-handle").css({
        width: 5,
        "margin-left": -2.5
    });
}

// initial volume slider, 4th slider
function initVolSlider($slider, videoObj) {
    var masterVolume = $("#volumeslider").slider("value") / 100;
    var slider = $slider.slider({
        orientation: "horizontal",
        range: "min",
        step: 0.01,
        min: 0,
        max: 100,
        value: videoObj.sVolume / masterVolume * 100,
        slide: function(event, ui) {
            // console.log("vol: " + ui.value);
            var sliderId = $slider.attr("id");
            var i = parseInt(sliderId.slice(-1)) - 1;
            var video = videoObj.videoDOM;
            var mainVolSliderVal = $volMainSlider.slider("value") / 100;
            video.volume(ui.value / 100 * mainVolSliderVal);
            // sVols[indexInArray] = ui.value / 100;
            var vol_slider_id =  "#td_vol_info_" + (i+1);
            $(vol_slider_id).html("&nbsp" + Math.round(ui.value)/100);
        }
    });
    slider.find(".ui-slider-handle").css({
        width: 5,
        "margin-left": -2.5
    });
}

// with input starting value, the changed handle's value, and video object
function setVideoPosition(sVal, cVal, videoObj) {
    var startPer = sVal / 100;
    var changeHandlePer = cVal / 100;
    var video = videoObj.videoDOM;
    if (sVal == cVal) {
        video.currentTime(video.duration() * startPer);
    }
    else {
        video.currentTime(video.duration() * changeHandlePer);
        setTimeout(function() {
            video.currentTime(video.duration() * startPer);
        }, 1500);
    }
}

// var transitVideos; 
// the master scrubber's slide start event
$scrubber.on("slidestart", function(event, ui) { 
    var mainSliderEvents = new Array();
    var mSliderEvent = new MasterSliderEvent();
    mSliderEvent.actItem = event.currentTarget.id;
    mSliderEvent.action = SLIDERSTART;
    mSliderEvent.sliderTime = convertTimeToNumber($currentTimeDisplay.html());
    mSliderEvent.sysTime = getStandardTime();
    console.log("clickItem: " + mSliderEvent.actItem + " action" + mSliderEvent.action + 
    		" The slider starts from: " + mSliderEvent.sliderTime
    		+ " sysTime: " + mSliderEvent.sysTime);
    mainSliderEvents.push(mSliderEvent);
    var rightVideos = saveRight();
    // transitVideos = rightVideos;
    var leftVideos = saveLeft();
    $.get("CollectInfo", {
        "mSliderEvents": JSON.stringify(mainSliderEvents), 
    	"rightVideos": JSON.stringify(rightVideos), 
        "leftVideos": JSON.stringify(leftVideos)
    });
    // console.log("the slide starts from: " + userEvent.currTime);
});

// the master scrubber's slide stop event
$scrubber.on("slidestop", function(event, ui) { 	
	var mainSliderEvents = new Array();
    var mSliderEvent = new MasterSliderEvent();
    mSliderEvent.actItem = event.currentTarget.id;
    mSliderEvent.action = SLIDERSTOP;
    mSliderEvent.sliderTime = convertTimeToNumber($currentTimeDisplay.html());
    mSliderEvent.sysTime = getStandardTime();
    console.log("clickItem: " + mSliderEvent.actItem + " action" 
            + mSliderEvent.action + 
    		" The slider starts from: " + mSliderEvent.sliderTime
    		+ " sysTime: " + mSliderEvent.sysTime);
    mainSliderEvents.push(mSliderEvent);
    var rightVideos = saveRight();
    var leftVideos = saveLeft();
    // var rightvideos = mvplayer.getVideos();
    // for (var i = 0; i < transitVideos.length; i++) {
    //     console.log("transit is: "  + transitVideos[i]["currTime"]);
    //     if (transitVideos[i]["currTime"] > rightVideos[i]["currTime"]) {
    //         var startTime = transitVideos[i]["currTime"];
    //         var stopTime = rightVideos[i]["currTime"];
    //         while (startTime >= stopTime) {
    //             var index = rightvideos[i].findSegmentIndex(startTime);
    //             rightvideos[i].segmentCheckers[index] = false;
    //             startTime = startTime - 0.5;
    //         };
    //         console.log("backwards");
    //     }
    // }

    $.get("CollectInfo", {
        "mSliderEvents": JSON.stringify(mainSliderEvents), 
    	"rightVideos": JSON.stringify(rightVideos), 
        "leftVideos": JSON.stringify(leftVideos)
    });
});

// function for saving current video's playing position and volume
function saveRight(player) {
    var videos = player.getVideos();
    var rightvideolist = [];
    for (var i = 0; i < videos.length; i++) {
        var videoObj = videos[i].toJSONObj();
        rightvideolist.push(videoObj);
    }
    return rightvideolist;
}

// function for saving videos(preview images) in left nav
function saveLeft() {
    // This method comes from http://stackoverflow.com/questions/652763/jquery-object-to-string
    var $images = $('<ul>').append($('#preview_gallery').clone()).html(); 
    return $images;
}

// release saved videos in the session storage
function releaseRight(rightvideolist) {
    $dropzone.remove();
    var newdropzone = sessionStorage.getItem("dropzone");
    $(".main").append($(newdropzone));
    // mvplayer.initCanvas();
    var mainSliderValue = sessionStorage.getItem("mainSlider");
    $timer.slider("value", mainSliderValue);
    // resetVariables();
    var mainVolume = sessionStorage.getItem("mainVol");
    $volMainSlider.slider("value", mainVolume);
    resetRightVideo(rightvideolist);
}

// release saved images in the session storage
function releaseLeft($images) {
    var $sidebar = $(".video_prev_container");
    $sidebar.empty();
    $sidebar.append($images);
}

// reset the videos in the right drop zone. each video should be back to the
// starting position
function resetRightVideo(rightvideolist) {
    if (rightvideolist.length == 0) {
        $currentTimeDisplay.html("0:00");
        $newDuration.html("0:00");
        return;
    }
    $dropzone = $("#dropzone");
    $previewImg = $(".videoprev");
    $playbutton = $("#playbutton");

    if (mvplayer != null) {
        mvplayer.$playbutton.off("click");    // unregister click listener for the playbutton
        mvplayer.$volume.slider("destroy");
    }
    mvplayer = null;  // clear the cache
    mvplayer = new MVPlayer($playbutton, $timer, $volMainSlider);
    $(".draggablevideo").children("iframe").remove();
    mvplayer.initCanvas($previewImg, $dropzone, $playbutton);

    for (var i = 0; i < rightvideolist.length; i++) {
        var dropIndex = rightvideolist[i].videoId;
        var popVideo = setPopVideo(dropIndex);
        var $dropdiv = $(".dropdiv");
        var videoStartTime = rightvideolist[i].startTime;
        var videoEndTime = rightvideolist[i].endTime;
        var videoStartVolume = rightvideolist[i].startVolume;
        $dropdiv.draggable({
            containment: "parent"
        });
        $dropdiv.resizable();
        console.log("After release the video " + dropIndex + " currTime is " 
                    + videoStartTime
                    + " startTime is " + videoStartTime);
        (function(i) {    
            bindevents(mvplayer, popVideo, dropIndex, $dropdiv, rightvideolist[i]);
        })(i);

        $(".closebtn").click(function () {
            var videoId = findVideoIdByCloseBtn($(this));
            var video = mvplayer.findVideoById(videoId);
            mvplayer.recycleVideo(video);
        });
        // mvplayer.videos.push(droppedVideo);
    }
}

function resetVariables() {
    $dropzone = $("#dropzone");
    $previewImg = $(".videoprev");
    $playbutton = $("#playbutton"); 
    mvplayer = null;  // clear the cache
    var player = new MVPlayer($playbutton, $timer, $volMainSlider);
    $(".draggablevideo").children("iframe").remove();
    player.initCanvas($previewImg, $dropzone, $playbutton);
    return player;
}

$("#saveState").click(function() {
    var rightVideos = saveRight(mvplayer);
    sessionStorage.setItem("rightvideolist", JSON.stringify(rightVideos));
    var $leftImages = saveLeft();
    // var leftImages = $leftImages.outerHTML;
    sessionStorage.setItem("leftimages", $leftImages);
    var mainSliderValue = $timer.slider("value");
    sessionStorage.setItem("mainSlider", mainSliderValue);
    var mainVolume = $volMainSlider.slider("value");
    sessionStorage.setItem = ("mainVol", mainVolume);
    $(".dropdiv").resizable("destroy");
    var dropzoneHtml = $dropzone[0].outerHTML;
    sessionStorage.setItem("dropzone", dropzoneHtml);
});

// retrieve from the session
$("#retrieveState").click(function() {
    // var leftvideos = JSON.parse(sessionStorage.getItem("leftvideolist"));
    var rightvideos = JSON.parse(sessionStorage.getItem("rightvideolist"));
    var leftimages = sessionStorage.getItem("leftimages");
    var $images = $(leftimages);
    releaseLeft($images);
    releaseRight(rightvideos);
});

// once the video is dragged out, it is removed from sessionStorage
function removeVideoFromSession(video) {
    var videos = JSON.parse(sessionStorage.getItem("videolist"));
    var activeVideoList = JSON.parse(sessionStorage.getItem("activevideolist"));
    var index = -1;
    for (var i = 0; i < videos.length; i++) {
        if (videos[i].videoId == video.id) {
            index = i;
        }
    }
    if (index != -1) {
        videos.splice(index, 1);
        // activeVideoList.splice(index, 1);
        sessionStorage.setItem("videolist", JSON.stringify(videos));
        sessionStorage.setItem("activevideolist", JSON.stringify(activeVideoList));
    }
    else {
        return;
    }
}

// AJAX call from ui log
$("#log").click(function() {
	$.get("DisplayInfo");
});

// function for current mm:ss to s
function convertTimeToNumber(time) {
    var nTimes = time.split(":");
    var nMin = nTimes[0].valueOf()*60;
    var nSec = nTimes[1].valueOf();
    var nTime = parseFloat(nMin) + parseFloat(nSec);
    return nTime;
}

// function for converting time to be format mm:ss
/* function convertTimeToString(time) {
    var min = 0;
    var sec = 0;
    if (time < 60) {
        sec = parseInt(time);
    }
    else {
        min = parseInt(time/60);
        sec = parseInt(time) - min*60;
    }

    if (sec < 10)
        return min + ':0' + sec;
    else return min + ':' + sec;
} */

// function for converting time to be format mm:ss
function convertTimeToString(secs) {
    var hr = Math.floor(secs / 3600);
    var min = Math.floor((secs - (hr * 3600))/60);
    var sec = Math.floor(secs - (hr * 3600) - (min * 60));

    if (hr < 10) {hr = '0' + hr; }
    if (min < 10) {min = '0' + min;}
    if (sec < 10) {sec = '0' + sec;}
    if (hr) {hr = '00';}
    // return hr + ':' + min + ':' + sec;   // if there is a long video (> 1 hour)
    return min + ':' + sec;
}


// get system's current time
function getSysTime () {
    var sysCurrTime = new Date();
    var sysTime = sysCurrTime.getFullYear() + "-" + (sysCurrTime.getMonth() + 1)
                        + "-" + sysCurrTime.getDate() + "-" 
                        + (sysCurrTime.getHours()) 
                        + ":" + sysCurrTime.getMinutes() + ":" 
                        + sysCurrTime.getSeconds();
    return sysTime;
}

// get system's current time since 1970/1/1
function getStandardTime () {
    var sysCurrTime = new Date();
    var sysTime = sysCurrTime.getTime();
    return sysTime;
}

// this function is called by save session button is clicked
function saveQtip($button) {
    // qtip for individual video information
    $button.qtip({
        content: {
            text: "Current Session is saved"
        },  
        style: {
            def: false, // Remove the default styling 
            classes: 'qtip-tipsy'
        },
        position: {
            my: 'top center',  // Position my center...
            at: 'bottom center', // at the center of...
            target: $('#branding')
        },
        show: {
            event: 'click',
            effect: function() {
                $(this).fadeTo(200, 1);
            }
        },
        hide: {
            fixed: true,
            delay: 300,
            effect: function() {
                $(this).fadeOut();
            },
            inactive: 2000
        }
    });
}

// this function is called by retrieve session button is clicked
function retrieveQtip($button) {
    // qtip for individual video information
    $button.qtip({
        content: {
            text: "Saved Session is Retrieved"
        },  
        style: {
            def: false, // Remove the default styling 
            classes: 'qtip-tipsy'
        },
        position: {
            my: 'top center',  // Position my center...
            at: 'bottom center', // at the center of...
            target: $('#branding')
        },
        show: {
            event: 'click',
            effect: function() {
                $(this).fadeTo(200, 1);
            }
        },
        hide: {
            fixed: true,
            delay: 300,
            effect: function() {
                $(this).fadeOut();
            }
        }
    });
}

$("#longDuration").click(function() {
    mvplayer.isDurationLong = true;
    var $span = $playbutton.children("span:visible");
    if ($span.attr("title") == "Replay") {
        showPlay();
    }
    mvplayer.setDuration();
    mvplayer.updateScrubber();
});

$("#shortDuration").click(function() {
    mvplayer.isDurationLong = false;
    mvplayer.setDuration();
    mvplayer.updateScrubber();
});

function getMinDuration() {
    var diffs = [];
    for (var i = 0; i < eTimes.length; i++) {
        diffs[i] = eTimes[i] - sTimes[i];     
    }
    var minDiff = Math.min.apply(Math, diffs);
    return minDiff;
}

function getMaxDuration() {
    var diffs = [];
    for (var i = 0; i < eTimes.length; i++) {
        diffs[i] = eTimes[i] - sTimes[i];     
    }
    var maxDiff = Math.max.apply(Math, diffs);
    return maxDiff;
}

function shade(color, percent){
    if (color.length > 7 ) return shadeRGBColor(color, percent);
    else return shadeColor2(color,percent);
}

function blend(color1, color2, percent){
    if (color1.length > 7) return blendRGBColors(color1,color2,percent);
    else return blendColors(color1,color2,percent);
}

function shadeRGBColor(color, percent) {
    var f = color.split(",");
    var t = percent < 0 ? 0:255;
    var p = percent < 0 ? percent * -1 : percent;
    var R = parseInt(f[0].slice(4));
    var G = parseInt(f[1]);
    var B = parseInt(f[2]);
    return "rgb("+(Math.round((t-R)*p)+R)+","+
        (Math.round((t-G)*p)+G)+","+
        (Math.round((t-B)*p)+B)+")";
}

function blendRGBColors(c0, c1, p) {
    var f = c0.split(",");
    var t = c1.split(",");
    var R = parseInt(f[0].slice(4));
    var G = parseInt(f[1]);
    var B = parseInt(f[2]);
    return "rgb("+(Math.round((parseInt(t[0].slice(4))-R)*p)+R)+","+
        (Math.round((parseInt(t[1])-G)*p)+G)+","+
        (Math.round((parseInt(t[2])-B)*p)+B)+")";
}

function shadeColor2(color, percent) {   
    var f = parseInt(color.slice(1),16);
    var t = percent<0?0:255;
    var p = percent<0?percent*-1:percent;
    var R = f>>16;
    var G = f>>8&0x00FF;
    var B = f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000
        +(Math.round((t-G)*p)+G)*0x100
        +(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

function blendColors(c0, c1, p) {
    var f = parseInt(c0.slice(1),16);
    var t = parseInt(c1.slice(1),16);
    var R1 = f>>16;
    var G1 = f>>8&0x00FF;
    var B1 = f&0x0000FF;
    var R2 = t>>16;
    var G2 = t>>8&0x00FF;
    var B2 = t&0x0000FF;
    return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000
                +(Math.round((G2-G1)*p)+G1)*0x100
                +(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
}

// normalize the number of views, base is 1
function normalize(segments) {
    var ratio =  Math.max.apply(this, segments) / 1;
    var length = segments.length;
    var norms = [];
    for (var i = 0; i < length; i++) {
        norms[i] = segments[i] / ratio;
    }
    return norms;
}



// a function for finding minimum available index for dropdiv/video
// this function is not used if you don't want to show the video id the tool tip
// if you want to show the videos are in order, then this one should be used.
function findMinIndex(dropvideos) {
    var minIndex = -1;
    if (dropvideos.length == 0) {
        return minIndex = 1;
    }

    var indexes = new Array();
    for (var i = 0; i < dropvideos.length; i++) {
        var id = dropvideos[i].attr("id");
        var index = parseInt(id.slice(-1));
        indexes.push(index);
    }
   
    indexes.sort(function(a,b){
    	return a-b; 
    });
    
    if (indexes.length == 1) {
        minIndex = 2;
    }
    else {
        if (indexes[0] > 1) {
            minIndex = 1;
        }
        else {
            var minIndexFlag = false;
            var i = 1;
            for (; i < indexes.length; i++) {
                if ((indexes[i] - indexes[i-1]) > 1) {
                    minIndex = indexes[i-1] + 1;
                    minIndexFlag = true;
                }
            }
            if (!minIndexFlag) {
                minIndex = indexes[i-1] + 1;
            }
        }
    }
    return minIndex;
}
