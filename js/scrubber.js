/**
 * @author Jinyue  Xia
 */
$(document).ready(function () {
        $scrubber.slider({
            orientation: "horizontal",
            range: "min",
            //animate: "fast",
            step: 0.01,
            value: 0,
            min: 0,
            max: 100
        });    
        $scrubber.find(".ui-slider-handle").css({
            width: 10,
            "margin-left": -5
        });
});
