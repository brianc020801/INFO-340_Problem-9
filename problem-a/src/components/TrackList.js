import React, { useState ,useEffect } from 'react';
import { useParams } from 'react-router';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

const TRACK_QUERY_TEMPLATE = 'https://itunes.apple.com/lookup?id={collectionId}&limit=50&entity=song'

export default function TrackList({setAlertMessage}) { //setAlertMessage callback as prop
  const [trackData, setTrackData] = useState([]); //tracks to show
  const [isQuerying, setIsQuerying] = useState(false); //for spinner
  const [previewAudio, setPreviewAudio] = useState(null); //for playing previews!

  const urlParams = useParams(); //get album from URL

  useEffect(()=>{
    setIsQuerying(true);
    fetch(TRACK_QUERY_TEMPLATE.replace('{collectionId}', urlParams.collectionId))
    .then(function(response){
      return response.json();
    }).then(function(data){
      if(data.results.slice(1) == 0){
        setAlertMessage("No tracks found for album.");
      }
      setTrackData(data.results.slice(1));
    }).catch(function(error){
      setAlertMessage(error.message);
    }).then(function(){
      setIsQuerying(false);
    })
  }, [urlParams.collectionId, setAlertMessage]);


  //for fun: allow for clicking to play preview audio!
  const togglePlayingPreview = (previewUrl) => {
    if(!previewAudio) { //nothing playing now
      const newPreview = new Audio(previewUrl);
      newPreview.addEventListener('ended', () => setPreviewAudio(null)) //stop on end
      setPreviewAudio(newPreview); //rerender and save
      newPreview.play(); //also start playing
    } else {
      previewAudio.pause(); //stop whatever is currently playing
      setPreviewAudio(null); //remove it
    }
  }

  //sort by track number
  trackData.sort((trackA, trackB) => trackA.trackNumber - trackB.trackNumber)

  //render the track elements
  const trackElemArray = trackData.map((track) => {
    let classList = "track-record";
    if(previewAudio && previewAudio.src === track.previewUrl){
      classList += " fa-spin"; //spin if previewing
    }

    return (
      <div key={track.trackId}>
        <div role="button" className={classList} onClick={() => togglePlayingPreview(track.previewUrl)}>
          <p className="track-name">{track.trackName}</p>
          <p className="track-artist">({track.artistName})</p>
        </div>
        <p className="text-center">Track {track.trackNumber}</p>
      </div>      
    )
  })

  return (
    <div>
      {isQuerying && <FontAwesomeIcon icon={faSpinner} spin size="4x" aria-label="Loading..." aria-hidden="false"/>}
      <div className="d-flex flex-wrap">
        {trackElemArray}
      </div>
    </div>
  )
}
