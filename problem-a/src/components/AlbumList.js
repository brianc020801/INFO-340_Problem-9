import React from 'react';
import { Link } from 'react-router-dom';

export default function AlbumList({ albums }) {
  
  const elemArray = albums.map((anAlbum) => {
    return (
      <Link to={`/album/${anAlbum.collectionId}`} key={anAlbum.collectionId}>
        <img className="m-1" 
          src={anAlbum.artworkUrl100} 
          alt={anAlbum.collectionName}
          title={anAlbum.collectionName}
        />
      </Link>
    )
  })

  return (
    <div className="my-3">
      {elemArray}
    </div>
  )
}