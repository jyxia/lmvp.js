/*
 * @author
 * Jinyue Xia
 */

var $dragItems = $(".videoleft");
var $dropdivs = new Array();      // the divs contain dropped jQuery video objects 
var $dropzone = $("#dropzone");
var $volMainSlider  = $('#volumeslider');
var divIndex = 0; // this index for the dropdivs array global variable

function dragstartHandler(event) {
    var videoTagId = event.originalEvent.target.id;
    // console.log(event.originalEvent.target.id);
    event.originalEvent.dataTransfer.setData("text", 
        event.originalEvent.target.id);
    var handlers= $._data($dropzone[0], "events")["drop"];
    if (handlers == null) {
       $dropzone.bind("drop", dropHandler);
    }
    $dropzone.addClass("dragstart");
    // dropIndex = findMinIndex($dragvideos);
    // dropIndex = parseInt(videoTagId.slice(-1));
}

function dragenterHandler(event) {
    event.originalEvent.preventDefault();
    return true;
}

function dragOverHandler(event) {
    event.originalEvent.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = "move";
    return false;
}

function dragendHandler(event) {
    $dropzone.removeClass("dragstart");
}


function dropHandler(event) {
    event.originalEvent.stopPropagation();    
    var data = event.originalEvent.dataTransfer.getData("text");
    var video = document.getElementById(data);
    html5player.initDropVideo(video);
    html5player.bindSlider();
    html5player.pause();
    return false;
}

function dropVideo(videoObj) {
    var video = videoObj.videoDOM;
    var $video = $(video);
    var videoId = video.id;
    dropIndex = parseInt(videoId.slice(-1));
    var $popTable = $(document.createElement("table"))
                    .attr("id", "poptable_" + dropIndex);  
    $video.parent(".boxprev").remove(); // once the video is dropped, its parent div is removed
    createProgressTr(dropIndex, $popTable, videoObj);
    createAdjustSliderTr(dropIndex, $popTable, videoObj);
    createVolDisTr(dropIndex, $popTable, videoObj);
    createVolTr(dropIndex, $popTable, videoObj);
    $dropdivs[divIndex] = $(document.createElement("div")) //.attr("id", "dropdiv" + dropIndex)
                    .addClass("dropdiv");
    $dropdivs[divIndex].appendTo($dropzone);  // append the div block into dropzone
    var $dropVideoContainer = $(document.createElement("div"))
                    .addClass("videocontainer")
                    .appendTo($dropdivs[divIndex]);  
    initQtip($video, $popTable);
    // adjust div's height and width
    if (divIndex > 0) {
        $dropdivs[divIndex-1].css('width', '49%');
        $dropdivs[divIndex].width("49%"); 
    }

    $video.removeClass("videoleft")
            .attr("id", "video_"+dropIndex); //commented on 09/13
    $dropVideoContainer.append($video);  
    
    // pbstack holds many tiny progress divs
    var $pbStack = $(document.createElement("div"))
    					.addClass("progress progress_position");                    
    var divWidth = 100 / videoObj.segments.length + "%";
	for (var i = 0; i < videoObj.segments.length; i++) { 
		var pb_id = dropIndex + "_pb_" + i;
		$pb = $(document.createElement("div")).addClass("bar")
				.attr("id", pb_id).width(divWidth);
		$pb.css({
		    'background-image': 'none',
		    'background-color': '#CCFFCC'
		});
		$pbStack.append($pb);
//		var pb = $("#" + "pb_" + i); 
//		$pbStack.append(pb);
	}
	$dropVideoContainer.append($pbStack);
    $video.bind("dragstart", divDragstartHandler);
}

// once the video is dropped, the states need to be saved
// that is, save the activeVideos
function saveActiveVideos () {
    var activeVideoList = new Array();
    for (var i = 0; i < activeVideos.length; i++) {
        var video = new Video(i, activeVideos[i].id, activeVideos[i].currentTime, 
            sTimes[i], eTimes[i], activeVideos[i].volume, activeVideos[i].duration);
        activeVideoList.push(video);
    }
    sessionStorage.setItem("activevideos", JSON.stringify(activeVideoList));
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
    console.log("currTime in dragdrop: " + video.currentTime + " currTime in obj: " + 
                    videoObj.getCurrentTime());
    $td_progress_slider.append($progress_slider);
    var curr_video_time = convertTimeToString(video.currentTime);
    var $td_play_info = $(document.createElement("td"))
                    .html("&nbsp" + curr_video_time);
    $(video).bind("timeupdate", function () {
            $progress_slider.slider("value", video.currentTime/video.duration * 100);
            $td_play_info.html("&nbsp" + convertTimeToString(video.currentTime));
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
    var curr_video_vol = Math.round(video.volume*100)/100;
    var $td_vol_info = $(document.createElement("td"))
                    .html("&nbsp" + curr_video_vol);
    $(video).bind("volumechange", function () {
            $slider_dis_vol.slider("value", video.volume*100);
            $td_vol_info.html("&nbsp" + Math.round(video.volume*100)/100);
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
function initQtip($video, $popTable) {
    // qtip for individual video information
    $video.qtip({
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
            my: 'center',  // Position my center...
            at: 'center', // at the center of...
            target: $video // my target
        },
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

var dragSrcElement;  // a variable for the dragged item
// this drag start handler is for switching videos and dragging the selected video out
function divDragstartHandler(event) {
    $dropzone.unbind("drop", dropHandler);
    var targetId = event.originalEvent.target.id;
    event.originalEvent.dataTransfer.setData("switch", targetId);
    //var index = parseInt(targetId.slice(-1));   // get which video(dropdiv) is dragged
    dragSrcElement = this;
    $(this).qtip("hide");

    var $sidebar = $("#leftbox");
    var sidebarHandlers = $._data($sidebar[0], "events");
    if (sidebarHandlers == null) {
        $sidebar.bind("dragover", leftDragOverHandler);
        $sidebar.bind("drop", leftDropHandler);
        $sidebar.bind("dragend", divDragendHandler);
    }

    $(".videocontainer").bind("dragover", divDragOverHandler);
    $(".videocontainer").bind("drop", divDropHandler);
    $(".videocontainer").bind("dragend", divDragendHandler);
}

function divDragOverHandler(event) {
    if (event.preventDefault) {
        event.preventDefault();
    }
    event.originalEvent.dataTransfer.dropEffect = "move";
    return false;
}

// video is being dragged from the center
function leftDragOverHandler(event) {
    if (event.preventDefault) {
        event.preventDefault();
    }
    event.originalEvent.dataTransfer.dropEffect = "move";
    return false;
}

function leftDropHandler(event) {
    event.preventDefault();
    var $sidebar = $("#leftbox");
    var $leftdropdiv = $(document.createElement("div"))
                    .addClass("boxprev");
    var $parentDiv = $(dragSrcElement.parentNode); 
    var $parent_parentDiv = $parentDiv.parent();
    var video = $($parentDiv.children()[0]).detach();
    //var videocontainer = $($parentDiv.children()[0]).remove();
    $parentDiv.remove();
    $parent_parentDiv.remove();
    $leftdropdiv.append(video.attr("style", "")
                             .addClass("videoleft"));                 
    $sidebar.append($leftdropdiv);
    divIndex--;
    video.bind("dragstart", dragstartHandler);
    deleteVideo(video);
    // removeVideoFromSession(video);
    // html5player.initScrubber();
    // html5player.volumeSlider();
    html5player.setDuration();
    //init(dropvideos);

    if (divIndex == 1) {
        $dropdivs[divIndex-1].css('width', '98%');
        //$dropdivs[divIndex].width("49%"); 
    }
    $(".videocontainer").unbind("dragover", divDragOverHandler);
    $(".videocontainer").unbind("drop", divDropHandler);
    video.currentTime = 0;
    video.unbind("dragstart", divDragstartHandler);
}

function divDropHandler(event) {
    event.preventDefault();
    if (dragSrcElement != this) {
        //console.log($(dragSrcElement));
        var children = $(this).children();
        var $parentDiv = $(dragSrcElement.parentNode);
        var video = $($parentDiv.children()[0]).detach();   //the index is still 0 since the first has been deleted
                                                            // the second child comes to be 2nd one
        $parentDiv.append($(children[0]));
        $(this).append(video);     
    }
}

function divDragendHandler(event) {
    // $dropzone.bind("drop", dropHandler);
    $(".videocontainer").unbind("dragover", divDragOverHandler);
    $(".videocontainer").unbind("drop", divDropHandler);
    var $sidebar = $("#leftbox");
    var sidebarHandlers = $._data($sidebar[0], "events");
    if (sidebarHandlers != null) {
        $sidebar.unbind("dragover", leftDragOverHandler);
        $sidebar.unbind("drop", leftDropHandler);
        $sidebar.unbind("dragend", divDragendHandler);
    }
    html5player.pause();
}

function deleteVideo(video) {
    var index = -1;
    var videos = html5player.videos;
    for (var i = 0; i < videos.length; i++) {
        if (videos[i].getVideoDOM().id == video.attr("id")) {
            index = i;
        }
    }
    // var index = $.inArray(video, $dragvideos);
    // dropvideos.splice(index, 1);
    html5player.videos.splice(index,1);
    $dropdivs.splice(index, 1);
    // sTimes.splice(index, 1);
    // eTimes.splice(index, 1);
    // media_durations.splice(index, 1);
    // sVols.splice(index, 1);
    video.qtip("destroy", true);
}

$(document).ready(function () {  
    $dragItems.bind("dragstart", dragstartHandler);
    $dropzone.bind("dragenter", dragenterHandler);
    $dropzone.bind("dragover", dragOverHandler);
    $dropzone.bind("dragend", dragendHandler);
    $dragItems.bind("dragend", dragendHandler);
    //$dropzone.bind("drop", dropHandler);  
});