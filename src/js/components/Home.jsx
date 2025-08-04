import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// Helper function to format time from seconds to MM:SS
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Main AudioPlayer Component
const AudioPlayer = () => {
  // State to hold the list of songs fetched from the API
  const [songs, setSongs] = useState([]);
  // State for the currently playing song object
  const [currentSong, setCurrentSong] = useState(null);
  // State to track if the audio is playing
  const [isPlaying, setIsPlaying] = useState(false);
  // State for the current playback time
  const [currentTime, setCurrentTime] = useState(0);
  // State for the total duration of the song
  const [duration, setDuration] = useState(0);
  // Reference to the HTML audio element
  const audioRef = useRef(null);

  // useEffect to fetch the song list when the component mounts
  useEffect(() => {
    fetch("https://playground.4geeks.com/sound/songs")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Fetch failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const fetchedSongs = data.songs || [];
        setSongs(fetchedSongs);
        if (fetchedSongs.length > 0) {
          // Set the first song as the initial current song
          setCurrentSong(fetchedSongs[0]);
        }
      })
      .catch((err) => console.error("Error fetching songs:", err.message));

    // Event listeners for the audio element
    const audio = audioRef.current;
    if (audio) {
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleLoadedMetadata = () => setDuration(audio.duration);
      const handleEnded = () => playNext();

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);

      // Cleanup function to remove event listeners on component unmount
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  // useEffect to handle changes to the current song
  useEffect(() => {
    if (currentSong) {
      // Construct the full URL for the song
      const fullUrl = `https://playground.4geeks.com${currentSong.url}`;
      audioRef.current.src = fullUrl;
      
      // If a new song is selected while playing, automatically start it
      if (isPlaying) {
        audioRef.current.play().catch((err) => console.error("Playback error:", err));
      }
    }
  }, [currentSong]);

  // Handler to play a specific song from the list
  const playSong = (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    // Play the song immediately
    audioRef.current.play().catch((err) => console.error("Playback error:", err));
  };

  // Handler to play the next song in the playlist
  const playNext = () => {
    const index = songs.findIndex((s) => s.id === currentSong?.id);
    const nextIndex = (index + 1) % songs.length;
    playSong(songs[nextIndex]);
  };

  // Handler to play the previous song in the playlist
  const playPrevious = () => {
    const index = songs.findIndex((s) => s.id === currentSong?.id);
    const prevIndex = (index - 1 + songs.length) % songs.length;
    playSong(songs[prevIndex]);
  };

  // Handler to toggle between play and pause
  const togglePlayPause = () => {
    if (!currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.error("Playback error:", err));
    }
    setIsPlaying(!isPlaying);
  };

  // Handler for the timeline slider to seek to a new position
  const handleTimelineChange = (e) => {
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="audio-player-wrapper">
      <div className="main-card">
        <h1 className="title">API Audio Player</h1>

        {/* Current Song Display */}
        <div className="current-song-info">
          <p className="song-name">{currentSong ? currentSong.name : "Select a song"}</p>
          <p className="status">{currentSong ? "Now Playing" : "Playlist empty"}</p>
        </div>

        {/* Playback Controls */}
        <div className="controls">
          <button
            onClick={playPrevious}
            className="control-button"
            disabled={!currentSong}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            onClick={togglePlayPause}
            className="control-button play-pause-btn"
            disabled={!currentSong}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={playNext}
            className="control-button"
            disabled={!currentSong}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
            </svg>
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="timeline-container">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleTimelineChange}
            className="timeline-slider"
            disabled={!currentSong}
          />
          <span>{formatTime(duration)}</span>
        </div>

        {/* Playlist */}
        <div className="playlist-card">
          <h2 className="playlist-title">Playlist</h2>
          <ul className="playlist-list">
            {songs.length > 0 ? (
              songs.map((song) => (
                <li
                  key={song.id}
                  onClick={() => playSong(song)}
                  className={`playlist-item ${currentSong?.id === song.id ? "active" : ""}`}
                >
                  <span className="song-id">{song.id}</span>
                  <span className="song-name">{song.name}</span>
                </li>
              ))
            ) : (
              <li className="loading-message">Loading songs...</li>
            )}
          </ul>
        </div>
      </div>
      {/* HTML audio element (hidden) */}
      <audio ref={audioRef}></audio>
    </div>
  );
};


export default AudioPlayer;
