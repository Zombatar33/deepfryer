import { useRef, useEffect } from "react";
import { Helmet } from 'react-helmet';
import CanvasManipulator from "./CanvasManipulator";
import AudioManipulator from "./AudioManipulation";

/**
 * Element for video playback
 * @param {*} _ videoReference 
 * @returns the element
 */
function VideoPlayer({ video }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null)
    let prevVideo = useRef(null);

    useEffect(() => {
        if (prevVideo.current) {
            URL.revokeObjectURL(prevVideo.current);
        }
        prevVideo.current = video;
    }, [video]);


    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.src = URL.createObjectURL(video);
        }
    }, [video]);
    
    return (
            <div className="video-controls">
                <div className="screens">
                    <div className="video-player">
                        <h1>Original:</h1>
                        <video id="video" className="upload-image" controls={true} width="400" crossOrigin="anonymous" ref={videoRef}>
                        <source src={URL.createObjectURL(video)} type={video.type} />
                        </video>
                    </div>

                    <div className="video-canvas">
                        <h1>Processed:</h1>
                        <canvas id="canvas" ref={canvasRef}></canvas>
                    </div>
                </div>

                <div className="controls">
                    <CanvasManipulator canvasRef={canvasRef} videoRef={videoRef}></CanvasManipulator>
                    <AudioManipulator videoRef={videoRef}></AudioManipulator>
                    <div className="authors">
                        <p>Deep Fryer v1.0</p>
                        <br></br>
                        <p>Adam Ebied, s0577868@htw-berlin.de</p>
                        <p>Sebastian Gomoll, s0578431@htw-berlin.de</p>
                        <p>Alexander Mai, s0579081@htw-berlin.de</p>
                    </div>
                </div>

                <Helmet>
                    <script type="text/javascript">
                        {`
                            // this part is really hacky, but is neccessary to adjust the canvas height, else it defaults to 300x150
                            var v = document.getElementById('video');
                            v.addEventListener("loadedmetadata", function (e) {
                                var width = this.getBoundingClientRect().width,
                                    height = this.getBoundingClientRect().height;

                                var c = document.getElementById('canvas');
                                c.width = width * 1;
                                c.height = height * 1;
                            }, false);
                        `}
                    </script>
                </Helmet>
            </div>
    );
}

export default VideoPlayer;