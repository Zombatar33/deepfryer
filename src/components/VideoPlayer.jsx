import { useRef, useEffect } from "react";
import CanvasManipulator from "./CanvasManipulator";
import AudioManipulator from "./AudioManipulation";

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
                <div key="video-player" className="video-player">
                    Original:
                    <br></br>
                    <video id="my-video" controls={true} width="480" height="270" crossOrigin="anonymous" ref={videoRef}>
                    <source src={URL.createObjectURL(video)} type={video.type} />
                    </video>
                    <br></br>
                    Processed:
                    <br></br>
                    <canvas id="my-canvas" width="480" height="270" ref={canvasRef}></canvas>
                </div>

                <div key="controls" className="controls">
                    <CanvasManipulator canvasRef={canvasRef} videoRef={videoRef}></CanvasManipulator>
                    <AudioManipulator videoRef={videoRef}></AudioManipulator>
                    <div className="authors">
                        <p>Adam Ebied, s0577868@htw-berlin.de</p>
                        <p>Sebastian Gomoll, s0578431@htw-berlin.de</p>
                        <p>Alexander Mai, s0579081@htw-berlin.de</p>
                    </div>
                </div>
            </div>

    );
}

export default VideoPlayer;