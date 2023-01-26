import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import "../css/VideoUploader.css"

function VideoUploader() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileUpload = event => {
        setSelectedFile(event.target.files[0]);
    }

    const handleDrop = event => {
        event.preventDefault();
        setSelectedFile(event.dataTransfer.files[0]);
        setIsDragOver(false);
    }

    const handleDragOver = event => {
        event.preventDefault();
        setIsDragOver(true);
    }

    const handleDragLeave = event => {
        setIsDragOver(false);
    }

    return (
        <div>
            <div 
                className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <input type="file" accept="video/*" onChange={handleFileUpload} />
            </div>

            <div>            
                {selectedFile ? <VideoPlayer video={selectedFile} /> 
            :   <p>Please upload a video</p>}</div>
        </div>
    );
}

export default VideoUploader;