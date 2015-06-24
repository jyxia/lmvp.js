/* =============================================================================================================
                                        Youtube Multi-player Object
================================================================================================================*/

/**
    using popcorn.js to manipulate Youtube/Vimeo/html5 videos.
*/

var $dropzone = $("#dropzone");
var $preview_gallery = $("#preview_gallery");
var $newDuration = $("#duration_display");
var $currentTimeDisplay = $("#current_time_display");
var $volMainSlider = $("#volumeslider");
var $nPlay = $(".newplay");
var $nPause = $(".newpause");
var $nRepeat = $(".newrepeat");
var $timer = $('.time_slider');

// Object MultiVideoPlayer constructor
function MVPlayer($playbutton, $slider, $volume) {
    this.videos = [];
    this.$playbutton = $playbutton;
    this.$slider = $slider;
    this.$volume = $volume;
    this.isDurationLong = false;
    this.masterVideoIndex = -1;
    this.initVolSlider();
}

// drop video happens
MVPlayer.prototype.dropVideo = function( $item ) {
    $item.draggable("destroy");
    $item.removeClass("videoprev");
    $item.find("img").remove();
    //---> creating top div begins
    var $topDiv = $(document.createElement("div"))
                  .addClass("ui-draggable-handle");
    var $closebtn = $(document.createElement("button"))
                  .addClass("btn btn-default btn-md closebtn")
                  .attr("aria-hidden", "true");  
    var $closespan = $(document.createElement("span"))
                  .addClass("glyphicon glyphicon-remove")
                  .appendTo($closebtn);    
    $closebtn.appendTo($topDiv);
    // <----- close button ends 
    $topDiv.appendTo($item);
    // $topDiv.hover(showCloseBtn(), hideCloseBtn());
    $item.addClass("draggablevideo"); 
    $item.removeClass("galleryImg");
    $item.css({
        "height" : "100%",
        "width" : "100%",
        "top": "0px",
        "left": "0px"
    });
    var $dropdiv = $(document.createElement("div")) //.attr("id", "dropdiv" + dropIndex)
                 .addClass("dropdiv");
    $item.appendTo($dropdiv);
    $dropdiv.appendTo($dropzone);
    $dropdiv.draggable({
        containment: "parent"
    });
    $dropdiv.resizable();
    //$topDiv.mouseover(showCloseBtn());
    
    //this.pause();   // when a new video drags in, other videos should be paused
    var player = this;   // alias for current player object, for anonymous function call
    var dropIndex = parseInt($item.attr("id").slice(-1));
    var popVideo = setPopVideo(dropIndex);
    $closebtn.click(function () {
        var videoId = findVideoIdByCloseBtn($closebtn);
        var video = player.findVideoById(videoId);
        player.recycleVideo(video);
    });
    bindevents(player, popVideo, dropIndex, $dropdiv);
};

// register events within each video (param@videoJSON is from state retrival, otherwise null)
function bindevents(player, popVideo, dropIndex, $dropdiv, videoJSON) {
    // loadeddata event trigged
    popVideo.on( "loadeddata", function( e ) {
        var videoDuration = popVideo.duration();
        var currTime = 0;
        var videoObj;
        if (videoJSON != null) {   
            var currTime = videoJSON.currTime;
            var startTime = videoJSON.startTime;
            var endTime = videoJSON.endTime;
            var vol = videoJSON.vol;
            var segments = videoJSON.segments;
            videoObj = new Video(popVideo, startTime, endTime, vol);
            videoObj.segments = segments;
        } else {
            videoObj = new Video(popVideo, 0, videoDuration, 0.5);
        }

        popVideo.currentTime(currTime);
        popVideo.volume(vol);
        videoObj.setDivId(dropIndex);   // doing this for tracking video and sliders
        player.videos.push(videoObj);
        player.setDuration();
        player.bindSlider();
        var $popTable = $(document.createElement("table"))
                        .attr("id", "poptable_" + dropIndex);  
        createProgressTr(dropIndex, $popTable, videoObj);
        createAdjustSliderTr(dropIndex, $popTable, videoObj);
        createVolDisTr(dropIndex, $popTable, videoObj);
        createVolTr(dropIndex, $popTable, videoObj);
        initQtip($dropdiv, $popTable);

        // if the videoObj is retrieved from session, skip this part
        // if (videoObj.segments == null || videoObj.segments.length === 0) {
        //     videoObj.initSegArray();
        //     $dropdiv.append(createHeatMap(videoObj));
        // }
    });

    // ended event triggered.
    popVideo.on("ended", function()  {
        var videos = player.videos;
        if (!player.isDurationLong) {
            for (var i = 0; i < videos.length; i++) {
                if (!videos[i].getVideoDOM().paused()) {
                    videos[i].getVideoDOM().pause();
                }
            }
            showRepeat();
        }  
        else { 
            var masterVideo = player.getMaster().getVideoDOM();
            if (masterVideo.ended()) {
               showRepeat();
            }
        }      
    });
}

MVPlayer.prototype.initCanvas = function($previewImg, $dropzone, $playbutton) {
    // $videos = player.videos;
    var player = this;
    $previewImg.draggable({
        revert: "invalid", // when not dropped, the item will revert back to its initial position
        containment: "DOM",
        appendTo: $dropzone
    });

    // initialize drop zone 
    $dropzone.droppable({
        accept: "#preview_gallery > li > div", 
        activeClass: "ui-state-highlight",
        drop: function( event, ui ) {
            player.dropVideo( ui.draggable );         
        }
    });

    $timer.slider({
        value: 0,
        step: 0.01,
        orientation: 'horizontal',
        range: 'min',
        max: 100
    });

    // events section
    player.$playbutton.on("click", function() {
        var $span = $playbutton.children("span:visible");
        if ($span.attr("title") == "Play") {
            player.play();
        } else if ($span.attr("title") == "Pause") {
            player.pause();
        } else {
            player.replay();
        }
    });
    // $oVideo.removeAttr('controls');
};

// open API for play method
MVPlayer.prototype.play = function () {
    var $videos = this.getVideos();
    for (var i = 0 ; i < $videos.length; i++ ) {
        $videos[i].getVideoDOM().play();
    }
    showPause();
    // var videoSegCount = function () {
    //     for (var i = 0; i < $videos.length; i++) {
    //            $videos[i].segmentCounter();
    //        }
    // };
    // this.intID = window.setInterval(videoSegCount, 100);  // do the counter every 80 milliseconds

};

// open API for pause method
MVPlayer.prototype.pause = function () {
    var $videos = this.getVideos();
    for (var i = 0 ; i < $videos.length; i++ ) {
            $videos[i].getVideoDOM().pause();
        }
    showPlay();
    // window.clearInterval(this.intID);
    // console.log("the video's segments after pause are: " +  $videos[0].segments);

};

// open API for replay method
MVPlayer.prototype.replay = function () {
    this.$slider.slider("value", 0);
    this.resetVideos();
    $currentTimeDisplay.html("00:00");
    showPlay();
    // window.clearInterval(this.intID);
    // console.log("the video's segments after pause are: " + this.$videos[0].segmentCheckers);
};

// initial master volume controller
MVPlayer.prototype.initVolSlider = function () {
    var videos = this.videos;
    var $tooltip = $("#volToolTip");
    var volume = $('.volume');
    this.$volume.slider({
        range: "min",
        min: 0,
        max: 100,
        value: 50,
        animate: true,
        start: function(event,ui) {
            $tooltip.fadeIn('fast');
        },
        //Slider Event
        slide: function(event, ui) { 
            var value  = $(this).slider('value');
            $tooltip.css('left', value).text(ui.value); 
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
            for (var i = 0; i < videos.length; i++) {
                var id = videos[i].getDivId();
                var video = videos[i].getVideoDOM();
                var indVolSliderId = "#" + "volSlider_" + id;
                var indVolValue = $(indVolSliderId).slider("value") / 100;
                var newVol = ui.value / 100 * indVolValue;
                // console.log("slide value is: " + ui.value + " new volumen is: " + newVol);
                video.volume(newVol);
            }
        },
        start: function (event, ui) {
            
        },
        stop: function(event,ui) {
            $tooltip.fadeOut('fast');
        },
    });  //----> end of slider function
};

// reset the videos in this player to starting position 
MVPlayer.prototype.resetVideos = function() {
    for (var i = 0; i < this.videos.length; i++) {
        var video = this.videos[i].getVideoDOM();
        video.currentTime(this.videos[i].getStartTime());
    }
};

// get the video list
MVPlayer.prototype.getVideos = function () {
    return this.videos;
};

// get the master video
MVPlayer.prototype.getMaster = function () {
    return this.videos[this.masterVideoIndex];
};

// get the longest or shoest duraiton
MVPlayer.prototype.getDuration = function () {
    return this.masterDuration;
};

// set the master video index and the duration
MVPlayer.prototype.setMaster = function () { 
    var diffs = new Array();
    var videos = this.videos;
    if (videos.length == 0) {
        $newDuration.html("00:00");
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
};

// set the duration for the player
MVPlayer.prototype.setDuration = function () {
    this.setMaster();    // set the master video first
    var videos = this.videos;
    var masterVideoIndex = this.masterVideoIndex;
    this.unbindUpdateTime(videos);
    var player = this;
    if (this.masterVideoIndex != -1) {                // keep master slider updated with master video 
        videos[masterVideoIndex].getVideoDOM().on("timeupdate", function() {
            var videos = player.videos;
            var masterVideoObj = videos[player.masterVideoIndex];
            var mVideo = masterVideoObj.getVideoDOM();
            var msTime = masterVideoObj.getStartTime();
            var mDuration = masterVideoObj.getEndTime() - masterVideoObj.getStartTime();
            // mDuration = Math.floor(mDuration);          // change it to be a small integer
            var currTime = mVideo.currentTime() - msTime;
            if (currTime < 0.0001) {
                currTime = 0;
            }     
            $currentTimeDisplay.html(convertTimeToString(currTime));
            var percent = currTime / mDuration;
            player.$slider.slider("value", percent * 100);
            if (currTime >= mDuration) {
                // console.log("currTime: " + currTime + " masterDuration" + masterDuration);
                for (var i = 0; i < videos.length; i++) {
                    videos[i].getVideoDOM().pause();
                }
                // toggleShow();    
                showRepeat();
            }
            if (player.isDurationLong) {
                for (var i = 0; i < videos.length; i++) {
                    if (videos[i].getVideoDOM().currentTime() >= videos[i].getEndTime()) {
                        videos[i].getVideoDOM().pause();
                    }
                }
            }
        });   
        var currSliderValue = this.$slider.slider("value");
        var currShowTime = this.masterDuration * currSliderValue / 100;
        $currentTimeDisplay.html(convertTimeToString(currShowTime));
    }
};

// update master slider's scrubber's position
// wherever a video is dragged in or dropped out, the slider needs to be updated
MVPlayer.prototype.updateScrubber = function() {
    var player = this;
    var videos = player.videos;
    var masterVideoObj = videos[player.masterVideoIndex];
    var mVideo = masterVideoObj.getVideoDOM();
    var msTime = masterVideoObj.getStartTime();
    // var mDuration = masterVideoObj.getDuration();
    var mDuration = masterVideoObj.getEndTime() - masterVideoObj.getStartTime();
    var currTime = mVideo.currentTime() - msTime;
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
        showPlay(); 
    }
    if (player.isDurationLong) {
        for (var i = 0; i < videos.length; i++) {
            if (videos[i].getVideoDOM().currentTime() >= videos[i].getEndTime()) {
                videos[i].getVideoDOM().pause();
            }
        }
    }
};

// unbind updateTime event associated with all videos
MVPlayer.prototype.unbindUpdateTime = function(videos) {
    var player = this;
    for (var i = 0; i < videos.length; i++) {
        videos[i].getVideoDOM().off("timeupdate", player.updateScrubber);
    }
};

// seekTo function
MVPlayer.prototype.seekTo = function (skipTo) {
    var videos = this.videos;
    for (var i = 0; i < videos.length; i++) {
        var video = videos[i].getVideoDOM();
        var stopTo = videos[i].getStartTime() + skipTo; 
        if (stopTo >= videos[i].getEndTime()) {
            video.currentTime(videos[i].getEndTime());
        } else { 
            video.currentTime(stopTo); 
        }
    }
};

// bind master slider slide event
MVPlayer.prototype.bindSlider = function () {
    var mVideo = this.getMaster().getVideoDOM();
    var that = this;
    var videos = this.videos;
    // bind slide event with the main scrubber
    this.$slider.on("slide", function(event, ui) {
        mVideo.off("timeupdate",  that.updateScrubber);
        for (var i = 0; i < videos.length; i++) {
                var video = videos[i].getVideoDOM();
                video.pause();
        }
        showPlay();
        var percent = ui.value / 100;  
        var skipTo = percent * mVideo.duration();
        $currentTimeDisplay.html(convertTimeToString(skipTo));
        that.seekTo(skipTo); 
    });
};

MVPlayer.prototype.recycleVideo = function (video) {
    var id = video.getDivId();
    var videodivId = "#" +"video" + id;
    var $dropdiv = $(videodivId).parent();
    for (var i = 0; i < this.videos.length; i++) {
        if (this.videos[i].getDivId() == id) {
            index = i;
        }
    }
    $dropdiv.remove();
    this.videos.splice(index,1);
    // this.setDuration();
    if (this.videos.length > 0) {      
        this.setDuration();
    } else  {
        $newDuration.html("00:00");
        $currentTimeDisplay.html("00:00");
    }
    createThumbernail(id);
};

// given a video id (i.e. dropdive id), return the video object
MVPlayer.prototype.findVideoById = function(id) {
    var video; 
    for (var i = 0; i < this.videos.length; i++) {
        if (this.videos[i].getDivId() == id) {
            video = this.videos[i];
            break;
        }
    }
    return video;
};

// double click video, video goes to right, same function as drop video
MVPlayer.prototype.dbclickVideo = function(event) {
    // console.log(event.currentTarget);
    this.dropVideo($(event.currentTarget));
    // mvplayer.bindSlider();
    this.pause();
}

// show pause button
function showPause() {
    $nPlay.hide();
    $nRepeat.hide();
    $nPause.show();
}

// show play buttion
function showPlay() {
    $nPause.hide();
    $nRepeat.hide();
    $nPlay.show();
}

// show replay button
function showRepeat() {
    $nPause.hide();
    $nPlay.hide();
    $nRepeat.show();
}

// show close button for each video when mouse move on top div
function showCloseBtn() {
    $(".closebtn").show();
    console.log("hover in");
}

// show close button for each video when mouse move on top div
function hideCloseBtn() {
    $(".closebtn").hide();

    console.log("hover out");
}

// toggle button for minimize or maximize left
var isLeftMinimized = false;
$(".toggle-btn").click(function () {
    if (isLeftMinimized) {
        maxLeft();
    } else {
        minLeft();
    }
    $(".draggable").qtip({
        hide: {
            event: "unfocus"
        }
    });
});

function minLeft() {
    $(".sidebar").addClass("minimized", 800);  // 800 is for the animation time, only available when jquery UI is used.
    $(".main").removeClass("col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2", 800)
            .addClass("col-sm-12 col-md-12", 800);
    $(".leftToggle").hide();
    $(".rightToggle").show();
    isLeftMinimized = true;

}

function maxLeft() {
    $(".sidebar").removeClass("minimized", 800);
    $(".main").removeClass("col-sm-12 col-md-12")
    .addClass("col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2", 800);
    $(".rightToggle").hide();
    $(".leftToggle").show();
    isLeftMinimized = false;
}

// pass a div, initialize a popcorn video for the div
function setPopVideo(i) {
    var popVideo;
    var videoId = "#" + "video" + i;
    if ( i == 1) {
        popVideo = Popcorn.smart(videoId, 
                    "https://www.youtube.com/watch?v=4i_GFrlaStQ");  //mo
    } else if ( i == 2) {
        popVideo = Popcorn.smart(videoId, 
                    "https://www.youtube.com/watch?v=xIJSw3Mhyd8");  // nike
    } else if (i == 3) {
        popVideo = Popcorn.smart(videoId, 
                    "./videos/movie_300.mp4");
    } else if (i == 4) {
        popVideo = Popcorn.smart(videoId, 
                    "https://vimeo.com/11519435"); // big buck bunny
    } else if (i == 5) {
        popVideo = Popcorn.smart(videoId, 
                    "https://www.youtube.com/watch?v=SuHmEo0Bx7Q");  // 10s video
    } 

    return popVideo;
}

function createThumbernail(id) {
    $img = $(document.createElement("img"));
    switch (id) {
        case 1:
            $img.attr("src", "https://i.ytimg.com/vi/4i_GFrlaStQ/mqdefault.jpg");
            break;
        case 2:
            $img.attr("src", "https://i.ytimg.com/vi_webp/xIJSw3Mhyd8/mqdefault.webp");
            break;
        case 3:
            $img.attr("src", "./videoimages/movie_300");
            break;
        case 4:
            $img.attr("src", "https://i.vimeocdn.com/video/63478365_590x332.webp");
            break;
        case 5:
            $img.attr("src", "./videoimages/10s");
            break;    
    }
    
    $prevdiv = $(document.createElement("div"));
    $prevdiv.addClass("videoprev galleryImg");
    var prevdiv_id = "video" + id;
    $prevdiv.attr("id", prevdiv_id);
    $prevdiv.draggable({
        revert: "invalid", // when not dropped, the item will revert back to its initial position
        containment: "DOM",
        appendTo: $dropzone
    });
    $prevdiv.append($img);
    $li = $(document.createElement("li"));
    $li.append($prevdiv);
    $li.appendTo("#preview_gallery");
}


// first tr in popTable, used for individual progress of the video
function createProgressTr(dropIndex, $popTable, videoObj) {
    // video id index matches slider id index
    // this index minus 1 is the index of activeVideos array index
    // creating progress slider starting
    var video = videoObj.videoDOM;
    var $td_index = $(document.createElement("td"))
                    .html("video" + dropIndex);
    var $td_progress_slider = $(document.createElement("td"));
    var $progress_slider = $(document.createElement("div"))
                    .attr("id", "progress_slider_" + dropIndex)
                    .addClass("individualslider");
    initProgressSlider($progress_slider, videoObj);
    // console.log("currTime in dragdrop: " + video.currentTime() + " currTime in obj: " + 
    //                 videoObj.getCurrentTime());
    $td_progress_slider.append($progress_slider);
    var curr_video_time = convertTimeToString(video.currentTime());
    var $td_play_info = $(document.createElement("td"))
                    .html("&nbsp" + curr_video_time);
    video.on("timeupdate", function () {
            $progress_slider.slider("value", video.currentTime()/video.duration() * 100);
            $td_play_info.html("&nbsp" + convertTimeToString(video.currentTime()));
    });
    var $tr1 = $(document.createElement("tr"))
                    .append($td_index)
                    .append($td_progress_slider)
                    .append($td_play_info);
    $popTable.append($tr1);   // ending creating progress slider 
}

// second tr in popTable, used for users to manually adjust the start and end points
function createAdjustSliderTr(dropIndex, $popTable, videoObj) {
     // creating user's adjusting slider tr starting
    var video = videoObj.videoDOM;
    var $td_index = $(document.createElement("td"))
                    .html("video" + dropIndex);
    var $td_slider = $(document.createElement("td"));
    var $slider = $(document.createElement("div"))
                    .attr("id", "slider_" + dropIndex)
                    .addClass("individualslider");
    init2ndSlider($slider, videoObj);
    $td_slider.append($slider);
    var set_video_time = $slider.slider( "values", 0 );
    var $td_set_info = $(document.createElement("td"))
                    .attr("id", "td_set_info_"+ dropIndex)
                    .html("&nbsp" + convertTimeToString(videoObj.getStartTime()));
    var $tr2 = $(document.createElement("tr"))
                    .append($td_index)
                    .append($td_slider)
                    .append($td_set_info);
    $popTable.append($tr2);   // ending creating user's adjusting slider 
}

// third tr in popTable, used for the volume slider
function createVolDisTr(dropIndex, $popTable, videoObj) {
    // creating vol slider tr starting
    var video = videoObj.videoDOM;
    var $td_vol_dis = $(document.createElement("td"))
                    .html("volume");
                    //.html("video" + dropIndex);
    var $td_slider_vol_dis = $(document.createElement("td"));
    var $slider_dis_vol = $(document.createElement("div"))
                    .attr("id", "volDisSlider_" + dropIndex)
                    .addClass("individualvolslider")
                    .appendTo($td_slider_vol_dis);
    initDisVolSlider($slider_dis_vol, videoObj);                 // after the slider is created, intialize it.
    var curr_video_vol = Math.round(video.volume()*100)/100;
    var $td_vol_info = $(document.createElement("td"))
                    .html("&nbsp" + curr_video_vol);
    video.on("volumechange", function () {
            $slider_dis_vol.slider("value", video.volume()*100);
            $td_vol_info.html("&nbsp" + Math.round(video.volume()*100)/100);
    });
    var $vol_dis_tr2 = $(document.createElement("tr"))
                    .append($td_vol_dis)
                    .append($td_slider_vol_dis)
                    .append($td_vol_info);
    $popTable.append($vol_dis_tr2); // ending creating vol slider
}

// 4th tr in popTable, used for the volume slider
function createVolTr(dropIndex, $popTable, videoObj) {
    // creating vol slider tr starting
    var video = videoObj.videoDOM;
    var $td_vol = $(document.createElement("td"))
                    .html("volume");
                    //.html("video" + dropIndex);
    var $td_slider_vol = $(document.createElement("td"));
    var $slider_vol = $(document.createElement("div"))
                    .attr("id", "volSlider_" + dropIndex)
                    .addClass("individualvolslider")
                    .appendTo($td_slider_vol);
    initVolSlider($slider_vol, videoObj);                 // after the slider is created, intialize it.
    
    var $td_vol_info = $(document.createElement("td"))
                    .attr("id", "td_vol_info_" + dropIndex)
                    .html("&nbsp" + $slider_vol.slider("value")/100);

    var $vol_tr2 = $(document.createElement("tr"))
                    .append($td_vol)
                    .append($td_slider_vol)
                    .append($td_vol_info);
    $popTable.append($vol_tr2); // ending creating vol slider
}

// initialize the qtip for $video
function initQtip($target, $popTable) {
    // qtip for individual video information
    $target.qtip({
        content: {
            text: $popTable //Add .clone() if you don't want the matched elements to be removed, but simply copied
        },  
        style: {
            //widget: true, // Use the jQuery UI widget classes
            def: false, // Remove the default styling 
            classes: 'customized-qtipsy qtip-tipsy'
        },
        position: {
           /* my: 'bottom center',  // Position my top left...
            at: 'top center', // at the bottom right of...
            target: $video // my target*/
            my: 'center center',  // Position my center...
            at: 'center center', // at the center of...
            target: $target // my target
        },
        // show: 'click',   // for testing
        // hide: 'click'
        show: {
            delay: 400,
            event: 'mousemove',
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

// create each video's heatmap
function createHeatMap(videoObj) {
    // pbstack holds many tiny progress divs
    var $pbStack = $(document.createElement("div"))
                        .addClass("progress progress_position");                    
    var divWidth = 100 / videoObj.segments.length + "%";
    for (var i = 0; i < videoObj.segments.length; i++) { 
        var pb_id = videoObj.getDivId() + "_pb_" + i;
        $pb = $(document.createElement("div")).addClass("progress-bar")
                .attr("id", pb_id).width(divWidth);
        $pb.css({
            'background-image': 'none',
            'background-color': '#CCFFCC'
        });
        $pbStack.append($pb);
    }

    return $pbStack;
}

function findVideoIdByCloseBtn($closebtn) {
    var $videodiv = $closebtn.parents(".draggablevideo");
    return parseInt($videodiv.attr("id").slice(-1));
}
