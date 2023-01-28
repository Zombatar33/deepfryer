import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import "../css/App.css"

/**
 * Handles custom video upload
 * @returns the element
 */
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
        [
                <div key="drag-and-drop" className={`drag-and-drop__drop-zone ${isDragOver ? 'drag-and-drop__drag-over' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}>

                    <input type="file" accept="video/*" onChange={handleFileUpload} />
                </div>
                ,
                <div key="video">            
                    {selectedFile ? <VideoPlayer video={selectedFile} /> 
                :   <p className="upload-text">Please upload a video</p>}</div>
        ]
    );
}

export default VideoUploader;