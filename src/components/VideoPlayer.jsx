import { useRef } from "react";
import CanvasManipulator from "./CanvasManipulator";
import AudioManipulator from "./AudioManipulation";

function VideoPlayer() {

    const videoRef = useRef(null);
    const canvasRef = useRef(null)
    
    return (
        <div className="VideoPlayer">
            Original:
            <br></br>
            <video id="my-video" controls={true} width="480" height="270" crossOrigin="anonymous" ref={videoRef}>
                <source src="https://jplayer.org/video/m4v/Big_Buck_Bunny_Trailer.m4v" type="video/mp4" />
            </video>
            <br></br>
            Processed:
            <br></br>
            <canvas id="my-canvas" width="480" height="270" ref={canvasRef}></canvas>
            <CanvasManipulator canvasRef={canvasRef} videoRef={videoRef}></CanvasManipulator>
            <AudioManipulator videoRef={videoRef}></AudioManipulator>
        </div>
    );
}

export default VideoPlayer;