import React, { useState } from 'react'; //import React Component

import { Routes, Route, Link } from 'react-router-dom';
import { Alert } from 'react-bootstrap';

import AlbumSearchForm from './AlbumSearchForm';
import AlbumList from './AlbumList';
import TrackList from './TrackList';

const ALBUM_QUERY_TEMPLATE = "https://itunes.apple.com/search?limit=25&term={searchTerm}&entity=album&attribute=allArtistTerm"

function App(props) {
  const [albumData, setAlbumData] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  function fetchAlbumList(term){
    setIsSearching(true);
    setAlertMessage(null);
    fetch(ALBUM_QUERY_TEMPLATE.replace('{searchTerm}', term))
    .then(function(response){
      return response.json();
    }).then(function(data){
      if(data.results.length==0){
        setAlertMessage('No results found.');
      }
      setAlbumData(data.results);
    }).catch(function(error){
      setAlertMessage(error.message);
    }).then(function(){ 
      setIsSearching(false);
    })
  }

  return (
    <div className="container">
      <header className="mb-3">
        <h1>
          Play Some Music!
        </h1>
      </header>

      {/* display any error messages as dismissible alerts */}
      {alertMessage &&
        <Alert variant="danger" dismissible onClose={() => setAlertMessage(null)}>{alertMessage}</Alert>
      }

      <main>
        <Routes>
          <Route path="/" element={
            <> {/* Search Page */}
              <AlbumSearchForm searchCallback={fetchAlbumList} isWaiting={isSearching}/>
              <AlbumList albums={albumData} />
            </>
          } />
          <Route path="/album/:collectionId" element={
            <> {/* Collection Page */}
              <div><Link to="/" className="btn btn-primary mb-3">Back</Link></div>
              <TrackList setAlertMessage={setAlertMessage} />
            </>
          } />
        </Routes>
      </main>

      <footer>
        <small>Music Search via <a href="https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/">iTunes</a>.</small>
      </footer>
    </div>
  );
}

export default App;