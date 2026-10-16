const DB_NAME = "musicPlayer";
const DB_VERSION = 5;

let db;

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            database.createObjectStore("songs", {
                keyPath: "id"
            });

            database.createObjectStore("audioFiles", {
                keyPath: "id" 
            });

            database.createObjectStore("imageFiles", {
                keyPath: "id"
            });

            database.createObjectStore("playlists", {
                keyPath: "id"
            });
            
            makeNewPlaylist('All', [])
        };

        request.onsuccess = (event) => {
            db = event.target.result;

            resolve(db);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

function addItem(name, item) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            name,
            "readwrite"
        );

        const store = transaction.objectStore(name);

        store.put(item);

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

function removeItem(name, item) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            name,
            "readwrite"
        );

        const store = transaction.objectStore(name);

        store.delete(item);

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

async function getAllItem(name) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            name,
            "readonly"
        );

        const store = transaction.objectStore(name);

        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

function getItem(name, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            name,
            "readonly"
        );

        const store = transaction.objectStore(name);

        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

let songs;
let playlist;

async function init() {
    await openDatabase();

    songs = await getAllItem('songs');
    playlist = await getAllItem('playlists');
    
    renderSong(playlist[0].list[0])
    renderPlaylistList()
}

init();

async function addNewSongToPlaylist(id) {
    const allPlaylist = await getItem('playlists', 0)
    allPlaylist.list.push(id)
    addItem('playlists', allPlaylist)
    playlist = await getAllItem('playlists');
    songs = await getAllItem('songs');

    songs.length === 1 && renderSong(playlist[0].list[0])
    document.getElementById('playlistInfo').style.display === 'block' && renderPlaylist(openedPlaylist)
}

async function submitSong(event) {
    event.preventDefault();

    const audioFileInput = document.getElementById("audioFile");
    const audioFile = audioFileInput.files[0];
    const imageURL = imageInput.style.backgroundImage
    const imageFile = await downloadImage(imageURL.slice(5, -2));
    const title = document.getElementById("title");
    const artist = document.getElementById("artist");
    const id = crypto.randomUUID()

    const audio = new Audio();
    let duration;

    if (!audioFile) {
        alert("Please select an audio file.");
        return;
    } else if (!imageFile) {
        alert("Please select cover art file")
    }

    audio.src = URL.createObjectURL(audioFile);

    audio.addEventListener("loadedmetadata", () => {
        duration = audio.duration

        addItem('songs', {
            id: id,
            songName: title.value,
            artist: artist.value,
            duration: duration,
        })
    });

    addItem('audioFiles', {
        id: id,
        blob: audioFile 
    })    

    addItem('imageFiles', {
        id: id,
        blob: imageFile
    })

    await addNewSongToPlaylist(id)
    imageInput.value = null
    imageInput.style.backgroundImage = null
    audioFileInput.value = null
    title.value = null
    artist.value = null

    imageInput.innerHTML = `
            <p>
                <i class="fa-regular fa-camera"></i>
                <br>
                Add Cover Image
            </p>
    ` 
    imageInput.querySelector("p").style.display = 'block'
}

document.getElementById("audioForm").addEventListener("submit", (event) => {
    submitSong(event)
    document.getElementById("audioFormOverlay").style.display ="none"
});

async function findCoverInITunes(song, artist) {
    const response = await fetch(
    `https://itunes.apple.com/search?term=${song}-${artist}&entity=song&limit=20`
    );

    const data = await response.json();

    const artwork = await getArtworkUrl(data.results[0].artworkUrl100)
    imageInput.style.backgroundImage = `url(${artwork})`;
    imageInput.innerHTML = `
            <p>
                <i class="fa-regular fa-camera"></i>
                <br>
                Change cover image
            </p>
    ` 
    imageInput.querySelector("p").style.display = 'none'
}

function getArtworkUrl(url, size = 500) {
  return url.replace(
    /\/\d+x\d+bb\./,
    `/${size}x${size}bb.`
  );
}


async function downloadImage(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
    }

    return await response.blob();
}

async function removeLastSong() {
    const allPlaylist = await getItem('playlists', 0)
    const lastSongId = allPlaylist.list[allPlaylist.list.length-1]
    removeItem('songs', lastSongId)
    removeItem('audioFiles', lastSongId)
    removeItem('imageFiles', lastSongId)
    allPlaylist.list.pop()
    addItem('playlists', allPlaylist)
    playlist = await getAllItem('playlists');
    songs = await getAllItem('songs');
}

async function removeSong(id, chosenPlaylistIndex) {
    removeItem('songs', id)
    removeItem('audioFiles', id)
    removeItem('imageFiles', id)
    
    playlist.forEach(playlist => {
        const songIndex = playlist.list.indexOf(id);
        if (songIndex !== -1) {
            playlist.list.splice(songIndex, 1); 
        }
        addItem('playlists', playlist)
    })
    document.getElementById('playlistInfo').style.display !== 'none' && renderPlaylist(chosenPlaylistIndex)
}

async function makeNewPlaylist(name, songs) {
    const allPlaylist = await getAllItem('playlists') 
    const id = allPlaylist.length

    addItem('playlists', {
        id: id,
        name: name,
        list: songs
    })
    playlist = await getAllItem('playlists');
    renderPlaylistList()
}

async function removePlaylist(chosenPlaylistIndex) {
    await removeItem('playlists', chosenPlaylistIndex)
    playlist = await getAllItem('playlists')

    document.getElementById('songList').style.display='none'; 
    document.getElementById('playlistList').style.display='block';
    document.getElementById('playlistBack').style.display='none'
    document.getElementById('playlistInfo').style.display='none';
    document.getElementById('playlistInfoHr').style.display='none';
    document.querySelectorAll('.editPlaylistButton').forEach(div => {
        div.style.display = 'none';
    })
    document.getElementById('playlistName').innerText = 'Playlist';

    renderPlaylistList()
}