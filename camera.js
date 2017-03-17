Skip to content
This repository
Search
Pull requests
Issues
Gist
 @btothez
 Sign out
 Watch 2
  Star 14
  Fork 5 conorbuck/canvas-video-effects
 Code  Issues 0  Pull requests 0  Projects 0  Wiki  Pulse  Graphs
Branch: master Find file Copy pathcanvas-video-effects/index.html
d2bb02a  on Dec 19, 2012
@conorbuck conorbuck adding extra function param for ff fix
1 contributor
RawBlameHistory     
56 lines (47 sloc)  1.4 KB
<!DOCTYPE html>
<html>
<head>
    <title>WebCam Effects</title>
</head>
<body>
                
    <video id="video-stream" style="display:none;" width=545 height=344></video>
    <canvas id="canvas-video" width=545 height=344></canvas>
    <canvas id="canvas-effects" width=545 height=344></canvas>

    <script type="text/javascript">
        (function(){
            var video = document.getElementById('video-stream'),
                canvas = document.getElementById('canvas-video'),
                canvasEffect = document.getElementById('canvas-effects'),
                ctx = canvas.getContext('2d'),
                ctxEffects = canvasEffect.getContext('2d'),
                processor = new Worker('image-worker.js');
                w = video.width,
                h = video.height;
            /* Setup WebWorker messaging */
            processor.onmessage = function(event){
                ctxEffects.putImageData(event.data.dstData, 0, 0);
            };
            /* Setup video stream and canvas */
            navigator.getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;
            navigator.getUserMedia({video:true}, function(stream){
                video.src = URL.createObjectURL(stream);
                video.play();
                setInterval(render, 10);
            }, function(error){
                console.log('error', error);
            });
            var render = function(){
                ctx.drawImage(video, 0, 0, w, h);
                var srcData = ctx.getImageData(0,0,w,h);
                processor.postMessage({
                    imageData: srcData
                });
            };
        })();
    </script>

</body>
</html>
Contact GitHub API Training Shop Blog About
© 2017 GitHub, Inc. Terms Privacy Security Status Help