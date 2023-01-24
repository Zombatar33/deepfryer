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
        <div className="VideoPlayer">
            Original:
            <br></br>
            <video id="my-video" controls={true} width="480" height="270" crossOrigin="anonymous" ref={videoRef}>
            <source src={URL.createObjectURL(video)} type={video.type} />
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