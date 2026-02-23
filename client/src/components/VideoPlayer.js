import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const PlayerContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  
  .video-js {
    width: 100%;
    height: 600px;
    
    @media (max-width: 768px) {
      height: 300px;
    }
  }
  
  .vjs-big-play-button {
    background-color: rgba(229, 9, 20, 0.8);
    border: none;
    border-radius: 50%;
    width: 80px;
    height: 80px;
    line-height: 80px;
    font-size: 30px;
    
    &:hover {
      background-color: rgba(229, 9, 20, 1);
    }
  }
  
  .vjs-control-bar {
    background-color: rgba(0, 0, 0, 0.7);
  }
  
  .vjs-progress-control {
    .vjs-progress-holder {
      background-color: rgba(255, 255, 255, 0.3);
    }
    
    .vjs-load-progress {
      background-color: rgba(255, 255, 255, 0.5);
    }
    
    .vjs-play-progress {
      background-color: #e50914;
    }
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 18px;
  z-index: 1000;
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  padding: 20px;
  z-index: 1000;
`;

function VideoPlayer({ src, poster, title, onReady, onError }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ensure the video element is mounted in the DOM
    if (!videoRef.current || !videoRef.current.parentNode) {
      return;
    }

    // Small delay to ensure DOM is ready
    const initPlayer = () => {
      if (!videoRef.current) return;

      // Initialize Video.js player
      const player = videojs(videoRef.current, {
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        sources: [{
          src: src,
          type: 'video/mp4'
        }],
        poster: poster,
        preload: 'metadata'
      });

      playerRef.current = player;

      // Event listeners
      player.ready(() => {
        setIsLoading(false);
        if (onReady) onReady(player);
      });

      player.on('error', (e) => {
        const error = player.error();
        setError(error ? error.message : 'An error occurred while loading the video');
        setIsLoading(false);
        if (onError) onError(error);
      });

      player.on('loadstart', () => {
        setIsLoading(true);
        setError(null);
      });

      player.on('canplay', () => {
        setIsLoading(false);
      });
    };

    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(initPlayer, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, onReady, onError]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    if (playerRef.current) {
      playerRef.current.src(src);
      playerRef.current.load();
    }
  };

  return (
    <PlayerContainer>
      <div data-vjs-player>
        <video
          key={src} // Force re-render when src changes
          ref={videoRef}
          className="video-js vjs-default-skin"
          controls
          preload="auto"
          data-setup="{}"
        >
          <p className="vjs-no-js">
            To view this video please enable JavaScript, and consider upgrading to a web browser that
            <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
              supports HTML5 video
            </a>.
          </p>
        </video>
      </div>
      
      {isLoading && (
        <LoadingOverlay>
          Loading {title}...
        </LoadingOverlay>
      )}
      
      {error && (
        <ErrorMessage>
          <h3>Error loading video</h3>
          <p>{error}</p>
          <button 
            onClick={handleRetry}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#e50914',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </ErrorMessage>
      )}
    </PlayerContainer>
  );
}

export default VideoPlayer;
