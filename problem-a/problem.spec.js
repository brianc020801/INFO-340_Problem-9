const raf = require('raf') //fix raf warning, redux!

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import { MemoryRouter } from 'react-router';
import { act } from 'react-dom/test-utils';

// Console errors cause test failures
console['error'] = (errorMessage) => { 
  if(typeof errorMessage === "string"){ //why is sometimes not a string?
    expect(errorMessage.split('\n', 1)[0]).toBe("") 
  }
}

//Enzyme config
//Enzyme.configure({ adapter: new Adapter() });

//solution classes
//import 'whatwg-fetch';
import App from  './src/components/App';
import AlbumSearchForm from './src/components/AlbumSearchForm';
// import AlbumList from './src/components/AlbumList';

const EXAMPLE_ALBUM_RESULTS = {results:[{
  collectionId: 100,
  collectionName: "Album A",
  artworkUrl100: "http://domain.com/albumA.jpg",
}, {
  collectionId: 200,
  collectionName: "Album B",
  artworkUrl100: "http://domain.com/albumB.jpg",
}, {
  collectionId: 300,
  collectionName: "Album C",
  artworkUrl100: "http://domain.com/albumC.jpg",
}]};

const EXAMPLE_TRACK_RESULTS = {results:[{wrapperType: "collection"}, 
{
  trackId:101,
  artistName: "Artist A",
  trackName: "Song A",
  previewUrl: "https://domain.com/previewA.m4a"
}, {
  trackId:202,
  artistName: "Artist B",
  trackName: "Song B",
  previewUrl: "https://domain.com/previewB.m4a"
}, {
  trackId:303,
  artistName: "Artist C",
  trackName: "Song C",
  previewUrl: "https://domain.com/previewC.m4a"
}]}

require('jest-fetch-mock').enableMocks()


/* Begin the tests */

describe('The music search app', () => {
  it('renders without crashing (all components)', async () => {
    render(<MemoryRouter initialEntries={['/']}><App/></MemoryRouter>)
  });

  describe('The album search page', () => {
    it('submits encoded query on form submission', async () => {
      const mockCallback = jest.fn((queryText) => queryText);

      render(<AlbumSearchForm searchCallback={mockCallback}/>)
      await userEvent.type(screen.getByRole('textbox'), "two words"); //type in two words
      await userEvent.click(screen.getByRole('button'));

      expect(mockCallback).toHaveBeenCalled(); //called the function on submit
      expect(mockCallback).toHaveBeenCalledWith("two%20words"); //called with encoded input
    })

    it('fetches and renders album data on form submit', async () => {
      fetch.mockResponse(JSON.stringify(EXAMPLE_ALBUM_RESULTS)); //fetch returns albums

      render(<MemoryRouter initialEntries={['/']}><App/></MemoryRouter>)

      await userEvent.type(screen.getByRole('textbox'), "TEST"); //type in two words
      await userEvent.click(screen.getByRole('button')); //submit

      expect(fetch).toHaveBeenCalled(); //did fetch
      expect(fetch.mock.calls[0][0]).toMatch(/https:\/\/itunes.apple.com\/search\?.*term=TEST.*/) //search API w/ input term

      //screen.debug();
      expect(screen.getAllByRole('img').length).toBe(3); //shows 3 testing albums
      EXAMPLE_ALBUM_RESULTS.results.forEach((eachAlbum) => {
        let eachAlbumImage = screen.queryByAltText(eachAlbum.collectionName)        
        expect(eachAlbumImage).toBeInTheDocument();
        expect(eachAlbumImage.src).toBe(eachAlbum.artworkUrl100);
      })
    })

    it('shows spinner while searching for albums', async () => {
      fetch.mockResponse(() => {
        //from jest-fetch-mock example; fetch with delay
        return new Promise((resolve) => setTimeout(() => resolve({ body: JSON.stringify(EXAMPLE_ALBUM_RESULTS) }), 50))
      })

      render(<MemoryRouter initialEntries={['/']}><App/></MemoryRouter>)

      await userEvent.type(screen.getByRole('textbox'), "TEST"); //type in two words
      await userEvent.click(screen.getByRole('button')); //submit

      await waitFor(() => {
        let spinner = screen.queryByLabelText('Loading...');
        expect(spinner).toBeInTheDocument(); //shows after submit
      })

      await waitFor(() => {
        expect(screen.queryByLabelText('Loading...')).not.toBeInTheDocument(); //eventually goes away
      })
    })

    it('handles and displays errors', async () => {
      const ERROR_MESSAGE = "Could not fetch albums";
      fetch.mockReject(new Error(ERROR_MESSAGE)) //fetches will be rejected

      render(<MemoryRouter initialEntries={['/']}><App/></MemoryRouter>)
      await userEvent.type(screen.getByRole('textbox'), "TEST"); //type in two words
      await userEvent.click(screen.getByRole('button')); //submit

      expect(screen.queryByRole('alert')).toBeInTheDocument(); //shows error alert for rejected fetch
      expect(screen.queryByText(ERROR_MESSAGE)).toBeInTheDocument(); //shows error message
      
      await userEvent.click(screen.queryByLabelText('Close alert')); //close the alert

      //test return empty

      fetch.mockResponse(JSON.stringify({resultCount: 0, results: []})); //fetches return empty

      await userEvent.type(screen.getByRole('textbox'), "TEST"); //type in two words
      await userEvent.click(screen.getByRole('button')); //submit

      expect(screen.queryByRole('alert')).toBeInTheDocument(); //shows error alert for rejected fetch
      expect(screen.queryByText('No results found.')).toBeInTheDocument(); //shows error message, note the period!
    })
  })

  describe('The track listing page', () => {
    it('fetches data on component load', async () => {
      fetch.resetMocks();
      fetch.mockResponse(JSON.stringify(EXAMPLE_TRACK_RESULTS)); //fetch returns albums

      await act(async () => {
        render(<MemoryRouter initialEntries={['/album/123456']}><App/></MemoryRouter>)
      })
      expect(fetch).toHaveBeenCalled(); //did fetch
      expect(fetch.mock.calls[0][0]).toMatch(/https:\/\/itunes.apple.com\/lookup\?.*id=123456.*/) //search API w/ urlParam

      const trackButtons = screen.queryAllByRole('button');
      expect(trackButtons.length).toBe(3); //shows 3 buttons (slices off first element!)

      EXAMPLE_TRACK_RESULTS.results.slice(1).forEach((eachTrack) => {
        expect(screen.queryByText(eachTrack.trackName)).toBeInTheDocument; //shows track name
        expect(screen.queryByText(eachTrack.artistName)).toBeInTheDocument; //shows artist name
      })
    })

    it('shows spinner while loading track data', async () => {
      fetch.mockResponse(() => {
        //from jest-fetch-mock example; fetch with delay
        return new Promise((resolve) => setTimeout(() => resolve({ body: JSON.stringify(EXAMPLE_TRACK_RESULTS) }), 50))
      })

      await act(async () => {
        render(<MemoryRouter initialEntries={['/album/123456']}><App/></MemoryRouter>)
      })

      await waitFor(() => {
        let spinner = screen.queryByLabelText('Loading...');
        expect(spinner).toBeInTheDocument(); //shows after submit
      })

      await waitFor(() => {
        expect(screen.queryByLabelText('Loading...')).not.toBeInTheDocument(); //eventually goes away
      })
    })

    it('handles and displays errors', async () => {
      const ERROR_MESSAGE = "Could not fetch tracks"
      fetch.mockReject(new Error(ERROR_MESSAGE)) //fetches will be rejected

      let unmount;

      await act(async () => {
        ({unmount} = render(<MemoryRouter initialEntries={['/album/123456']}><App/></MemoryRouter>))
      })

      expect(screen.queryByRole('alert')).toBeInTheDocument(); //shows error alert for rejected fetch
      expect(screen.queryByText(ERROR_MESSAGE)).toBeInTheDocument(); //shows error message
      
      await userEvent.click(screen.queryByLabelText('Close alert')); //close the alert

      //test return empty

      fetch.mockResponse(JSON.stringify({resultCount: 0, results: []})); //fetches return empty
      unmount(); //remove old
      await act(async () => {
        render(<MemoryRouter initialEntries={['/album/123456']}><App/></MemoryRouter>)
      })

      expect(screen.queryByRole('alert')).toBeInTheDocument(); //shows error alert for rejected fetch
      expect(screen.queryByText('No tracks found for album.')).toBeInTheDocument(); //shows error message, note the period!
    })
  })
})
