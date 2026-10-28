// TODO:
//
// CURRENT:
// STYLE THE UI PLEASSSSEEEEEEE I WANT TS ON MY PORTFOLIO ASHJAKJSHAJKS
//
// that's it i think

let currentSongIndex =  0
let currentPlaylist = 0 
let queuedSongs = []

let isPlaying = false
let isLooped = false
let isShuffle = false

let isSeekbarDragged = false
let isMuted = false
let storedVolume = 0

let isListenerActive = true
let openedPlaylist = 0

const songAudio = document.getElementById('song')

function addNewSong(songName, artist, art, audio, duration) {
    const newSong = new songItem(songName, artist, art, audio, duration)
    songs.push(newSong)
}

function addNewPlaylist(songName, artist, art, audio, duration) {
    const newPlaylist = new songItem(songName, artist, art, audio, duration)
    playlist.push(newPlaylist)
}

async function removeSongFromPlaylist(id) {
    const selectedPlaylist = playlist[openedPlaylist]
    const songIndex = selectedPlaylist.list.indexOf(id);

    if (songIndex !== -1) {
        selectedPlaylist.list.splice(songIndex, 1); 
    }

    console.log(id, openedPlaylist)
    console.log(document.getElementById(`${id}:${openedPlaylist}`))
    document.getElementById(`${id}:${openedPlaylist}`).remove()
    addItem('playlists', selectedPlaylist)
}

async function renamePlaylist() {
    const name = document.getElementById('playlistNameChange').value
    document.getElementById('playlistName').innerText = truncateString(name)
    document.getElementById('playlistName').style.display = 'block'
    document.getElementById('playlistNameChange').style.display = 'none'
    document.getElementById('editName').style.display = 'block'
    document.getElementById('enterNewName').style.display = 'none'

    const selectedPlaylist = playlist[openedPlaylist]
    selectedPlaylist.name = name
    await addItem('playlists', selectedPlaylist)
    renderPlaylistList()
}

async function renderSongDiv(chosenPlaylistIndex, song, duration) {
    const imageFile = await getItem('imageFiles', song.id)
    const imageURL = URL.createObjectURL(imageFile.blob)

    const remainingSecond = Math.round(duration) % 60
    const formattedDuration = `${Math.floor(Math.round(duration)/60)}:${remainingSecond < 10 ? '0' + remainingSecond : remainingSecond}`
    const closeSong = chosenPlaylistIndex !== 0 ? `<i class="fa-solid fa-xmark removeSong" style="display: none;" onclick="event.stopPropagation(); removeSongFromPlaylist('${song.id}', ${chosenPlaylistIndex})"></i>` : `<i data-lucide="trash" class="removeSong" style="display: none; color: #EC7E7E;" onclick="event.stopPropagation(); removeSong('${id}', ${chosenPlaylistIndex})"></i>`

    const songInfoDiv = `
        <div class="playlistItem" onclick="currentPlaylist=${chosenPlaylistIndex}; changeTrack('${song.id}', true); 
                            window.matchMedia('(max-width: 600px)').matches && (document.getElementById('playlistBar').style.width = 0);"
                            id='${song.id}:${chosenPlaylistIndex}'
                            style="background:${(songs.indexOf(song)===playlist[currentPlaylist].list[currentSongIndex] && currentPlaylist === chosenPlaylistIndex) ? 
                            'rgba(182, 182, 182, 0.38)' : 'null'};">
            ${chosenPlaylistIndex !== 0 ? 
                `<div class="songDragHandler">
                    <i data-lucide="grip-vertical" style="width: 20px; height: 20px;"></i> 
                </div>` : ''
            }
            <img src="${imageURL}" width="50px" alt="cover art">
            <div>
                <p>${song.songName}</p>
                <p class="songListArtist">${song.artist}</p>
            </div>
            <div class="songListDuration">
                <p>${formattedDuration}</p>
                ${closeSong}
            </div>
        </div>
    `

    songList.insertAdjacentHTML('beforeend', songInfoDiv)
    lucide.createIcons();   
}

async function renderPlaylist(chosenPlaylistIndex) {
    document.getElementById('playlistList').style.display='none';
    document.getElementById('playlistBack').style.display='flex';
    document.getElementById('playlistInfo').style.display='block';
    document.getElementById('playlistInfoHr').style.display='block'
    document.getElementById('playlistPlay').className = chosenPlaylistIndex
    if (chosenPlaylistIndex !== 0) {
        document.querySelectorAll('.editPlaylistButton').forEach(div => {
            div.style.display = 'block';
        })
    }

    let totalDuration = 0
    openedPlaylist = chosenPlaylistIndex

    songList.style.display='block';

    songList.innerHTML = null
    for (id of playlist[chosenPlaylistIndex].list) {
        const song = songs.find(song => song.id === id)
        const duration = song.duration; 
        totalDuration += duration

        renderSongDiv(chosenPlaylistIndex, song, duration)
    }

    const {remainingHour, remainingMinute, remainingSecond} = getDuration(totalDuration)
    const formattedDuration = `${remainingHour ? remainingHour + 'h' : ''} ${remainingMinute}m ${remainingSecond}s`
    const playlistInfo = `${playlist[chosenPlaylistIndex].list.length} songs • ${formattedDuration}`
    document.getElementById('playlistInfos').innerText = playlistInfo
    document.getElementById('playlistInfo').onclick = function() {
        queuedSongs = []
        if (currentPlaylist !== chosenPlaylistIndex) {
            currentPlaylist=chosenPlaylistIndex
            changeTrack(playlist[chosenPlaylistIndex].list[0], true)
            togglePlayback(true)
        } else {
            togglePlayback()
        }
    }         

    if (currentPlaylist !== chosenPlaylistIndex) {
        document.getElementById('playlistPlay').innerHTML = `<i class='fa-solid fa-play'></i>`
    } else {
        document.getElementById('playlistPlay').innerHTML = document.getElementById('playButton').innerHTML 
    }
    document.getElementById('playlistName').innerText = truncateString(playlist[chosenPlaylistIndex].name)
    setPlaylistHighlight('rgb(182, 182, 182, 0.38)')

}

function shuffleSong() {
    queuedSongs.length === 0 && (queuedSongs = Array.from(playlist[currentPlaylist].list.keys()))            
    currentSongIndex = queuedSongs[Math.floor(Math.random() * queuedSongs.length)]
    queuedSongs.splice(queuedSongs.indexOf(currentSongIndex), 1)
}

function getDuration(duration) {
    const remainingSecond = Math.round(duration) % 60
    const remainingMinute = Math.floor(Math.round(duration) / 60) > 59 ? Math.floor(Math.round(duration) % 3600 / 60) : Math.floor(Math.round(duration) / 60)
    const remainingHour = Math.floor(Math.round(duration)) / 3600 ? Math.floor(Math.round(duration) / 3600) : null

    return {remainingHour, remainingMinute, remainingSecond}
}

function getNextSongIndex(action, isPlaylistPick) {
    const currentList = playlist[currentPlaylist].list
    if (isPlaylistPick) {
        currentSongIndex = currentList.findIndex(song => song === action)
        return currentList[currentSongIndex]
    }

    if (isShuffle && !isLooped) {
        shuffleSong()
    } else if (isShuffle && isLooped) {
        const tmpIndex = currentSongIndex

        while (currentSongIndex === tmpIndex) {
            currentSongIndex = Math.round(Math.random() * currentList.length - 1)        
        }
        songIndex = playlist[currentSongIndex]
    } else if (isLooped) {
        currentSongIndex += 0
    } else if (currentSongIndex === currentList.length - 1 && action === 1) {
        currentSongIndex = 0
    } else if (currentSongIndex === 0 && action === -1) {
        currentSongIndex = currentList.length - 1
    } else {
        currentSongIndex += action
    }

    return currentList[currentSongIndex]
}

async function renderSong(songId) {
    const currentSong = songs.find(song => song.id === songId)
    
    const audioFile = await getItem('audioFiles', songId)
    const imageFile = await getItem('imageFiles', songId)
    const audioURL = URL.createObjectURL(audioFile.blob)
    const imageURL = URL.createObjectURL(imageFile.blob)

    document.getElementById('background-image').style.backgroundImage = `url('${imageURL}')`
    document.getElementById('coverArt').src = imageURL
    document.getElementById('songName').innerText = currentSong.songName
    document.getElementById('songArtist').innerText = currentSong.artist

    songAudio.setAttribute('src', audioURL)

    const {remainingHour, remainingMinute, remainingSecond} = getDuration(currentSong.duration)
    document.getElementById('duration').innerText = `${remainingMinute}:${('0' + remainingSecond).slice(-2)}`

    document.getElementById('currentTime').innerText = '0:00/'
    document.getElementById('durationSeekbar').value = '0'
    updateSliderVisual(document.getElementById('durationSeekbar'))
}
    
function setPlaylistHighlight(value) {
    const songIndex = playlist[currentPlaylist].list[currentSongIndex]
    const highlightedPlaylistSong = document.getElementById(`${songIndex}:${currentPlaylist}`)
    highlightedPlaylistSong && (highlightedPlaylistSong.style.background = value)
}

async function changeTrack(action, isPlaylistPick = false) {
    setPlaylistHighlight(null)
    const songIndex = getNextSongIndex(action, isPlaylistPick)
    await renderSong(songIndex)
    setPlaylistHighlight('rgb(182, 182, 182, 0.38)')
    document.getElementById('playlistPlay').innerHTML = document.getElementById('playButton').innerHTML 

    isPlaying && songAudio.play()
}

function togglePlayback(alwaysPlay=false) {
    const togglePlaybackDoc = document.getElementById('playButton')
    const currentPlaylistPlay = document.getElementsByClassName(currentPlaylist) 
            
    isListenerActive = false
    if (!isPlaying || alwaysPlay) {
        togglePlaybackDoc.innerHTML = '<i class=\'fa-solid fa-pause\'></i>'
        songAudio.play()
        currentPlaylistPlay[0] &&  (currentPlaylistPlay[0].innerHTML ='<i class=\'fa-solid fa-pause\'></i>' ) 
        isPlaying = true
    } else {
        togglePlaybackDoc.innerHTML = '<i class=\'fa-solid fa-play\'></i>'
        currentPlaylistPlay[0] &&  (currentPlaylistPlay[0].innerHTML ='<i class=\'fa-solid fa-play\'></i>' ) 
        songAudio.pause()
        isPlaying = false
    }

    setTimeout(() => {
        isListenerActive = true
    }, 100);
} 

function updateSliderVisual(doc) {
    const sliderValue = Number(doc.value);

    if (doc === document.getElementById('durationSeekbar')) {
        doc.style.background = `linear-gradient(to right, #FFFFFF ${sliderValue/10}%, #666666 ${sliderValue/10}%)`;
        return
    }

    doc.style.background = `linear-gradient(to right, #FFFFFF ${sliderValue}%, #666666 ${sliderValue}%)`;
    const volumeIconDoc = document.getElementById('volumeIcon')
    songAudio.volume = sliderValue / 100
    let icon = "volume-high";

    if (sliderValue === 0)
        icon = "volume-xmark";
    else if (sliderValue < 20)
        icon = "volume-low";
    else if (sliderValue < 80)
        icon = "volume";

    volumeIcon.innerHTML = `<i class="fa-solid fa-${icon}"></i>`;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startTimeUpdater(bypass=false) {
    while (!songAudio.paused || bypass) {
        if (!isSeekbarDragged) {
            const currentTime = songAudio.currentTime
            const {remainingHour, remainingMinute, remainingSecond} = getDuration(currentTime)
            document.getElementById('currentTime').innerText = `${remainingMinute}:${('0' + remainingSecond).slice(-2)}/`
            document.getElementById('durationSeekbar').value = String((currentTime / songAudio.duration) * 1000)
            updateSliderVisual(document.getElementById('durationSeekbar'))
        }
        await delay(100)
    }
}

document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('mouseenter', () => {
        input.style.setProperty( '--color', `#FFFFFF`);
    })

    input.addEventListener('mouseleave', () => {
        input.style.setProperty( '--color', `transparent`);
    })
})

function setTargetDuration(duration, sliderPercent) {
    const targetTime = sliderPercent / 100 * duration
    const {remainingHour, remainingMinute, remainingSecond} = getDuration(targetTime)
    document.getElementById('currentTime').innerText = `${remainingMinute}:${('0' + remainingSecond).slice(-2)}/`
    updateSliderVisual(document.getElementById('durationSeekbar'))

    return targetTime
}

function getSeekbarInfo() {
    const currentList = playlist[currentPlaylist].list
    const currentSong = songs.find(song => song.id === currentList[currentSongIndex])
    const duration = currentSong.duration
    const sliderPercent = document.getElementById('durationSeekbar').value / 10
    return {duration, sliderPercent}
}

document.getElementById('durationSeekbar').addEventListener('input', (e) => {
    isSeekbarDragged = true

    const {duration, sliderPercent} = getSeekbarInfo()
    setTargetDuration(duration, sliderPercent) 
});

document.getElementById('durationSeekbar').addEventListener('pointerup', () => {
    isSeekbarDragged = false
    const {duration, sliderPercent} = getSeekbarInfo()
    const targetTime = setTargetDuration(duration, sliderPercent) 

    songAudio.currentTime = targetTime
});

// document.addEventListener("keydown", (event) => {
//     const volumeSlider = document.getElementById('volumeSlider')

//     if (event.key === " ") {
//         togglePlayback()
//     } else if (event.key === "m") {
//         if (!isMuted) {
//             storedVolume = volumeSlider.value 
//             volumeSlider.value = 0
//         } else {
//             volumeSlider.value = storedVolume 
//         }
//         updateSliderVisual(volumeSlider)
//         isMuted = !isMuted
//     } else if (event.key === "ArrowUp") {
//         volumeSlider.stepUp(5)
//         updateSliderVisual(volumeSlider)
//         isMuted = false
//     } else if (event.key === "ArrowDown") {
//         volumeSlider.stepDown(5)
//         updateSliderVisual(volumeSlider)
//     } else if (event.key === "ArrowLeft") {
//         songAudio.currentTime -= 5 
//         startTimeUpdater(true)
//     } else if (event.key === "ArrowRight") {
//         songAudio.currentTime += 5 
//         startTimeUpdater(true)
//     } else if (event.key === "p") {
//         changeTrack(-1)
//     } else if (event.key === "n") {
//         changeTrack(1)
//     } else if (event.key === "r") {
//         document.getElementById('repeat').click()
//     } else if (event.key === "h") {
//         document.getElementById('shuffle').click()
//     }
// })

document.querySelectorAll('.buttons').forEach((button) => {
    button.addEventListener("click", (e) => {
        e.currentTarget.blur();
    });
})

songAudio.addEventListener('play', startTimeUpdater);

songAudio.addEventListener("ended", function() 
{
    song.currentTime = 0
    changeTrack(1)
});

songAudio.addEventListener("pause", () => {
    (isListenerActive && songAudio.currentTime !== songAudio.duration ) && togglePlayback()
}) 

document.addEventListener("DOMContentLoaded", (event) => {
    updateSliderVisual(document.getElementById('volumeSlider'))
    updateSliderVisual(document.getElementById('durationSeekbar'))
})

const imageFile = document.getElementById("imageFile");
const imageInput= document.getElementById("imageFileInput");

imageFile.addEventListener("change", () => {
    if (imageFile.files.length > 0) {
        imageInput.style.backgroundImage = `url(${URL.createObjectURL(imageFile.files[0])})`;
        imageInput.innerHTML = `
                <p>
                    <i class="fa-regular fa-camera"></i>
                    <br>
                    Change cover image
                </p>
        ` 
        imageInput.querySelector("p").style.display = 'none'
        document.getElementById('coverNote').innerText = 'Custom cover selected'
    } else {
        setDefaultCover()
    }
});

function renderPlaylistList() {
    document.getElementById('playlistList').innerHTML = null
    playlist.forEach((playlist, index) => {
        const songDiv = `
            <div class="playlists" onclick="renderPlaylist(${index})">
                <i class="fa-solid fa-music"></i>
                <p>${playlist.name}</p>
            </div>
        `
        document.getElementById('playlistList').insertAdjacentHTML('beforeend', songDiv)
    })
}

let timeout;

function checkFinished() {
  clearTimeout(timeout);

  timeout = setTimeout(() => {
    const title = document.getElementById('title').value.trim();
    const artist = document.getElementById('artist').value.trim();

    if (title && artist) {
        findCoverInITunes(title, artist)
    }
  }, 400);
}

document.getElementById('title').addEventListener("input", checkFinished);
document.getElementById('artist').addEventListener("input", checkFinished);

async function renderNewPlaylistSelection() {
    document.getElementById('songSelectionOverlay').style.display = 'block'
    const songList = document.getElementById('songSelectionList')
    renderSongSelectionList(songList, true)
}

async function renderSongSelectionList(dom, isNew) {
    for (id of playlist[0].list) {
        const song = songs.find(song => song.id === id)
        const imageFile = await getItem('imageFiles', id)
        const imageURL = URL.createObjectURL(imageFile.blob)

        const songDiv = `
            <label class="songSelectDiv" for="${id}" data-name="${song.songName}" style="display: flex; align-items: center; justify-content: space-between; width: 500px; padding: 15px; margin: 0;">
                <div style="display: flex; gap: 20px;">
                    <img src="${imageURL}" width="50px">
                    <div style="display: flex; flex-direction: column; text-align: left; justify-content: center;">
                        <p>${song.songName}</p>
                        <p class="songListArtist">${song.artist}</p>
                    </div>
                </div>
                <input type="checkbox" id="${id}" class="songChecklist" value="${id}">
            </label>
        `
        dom.insertAdjacentHTML('beforeend', songDiv)

        if (!isNew) {
            if (playlist[openedPlaylist].list.includes(id)) {
                document.getElementById(id).checked = true
            }
        }
    }
    dom.insertAdjacentHTML("beforeend",`<p id="songNotFound" style="display: none;">The song is not in your library</p>`)
}

async function createPlaylist() {
    const checkedSongs = document.querySelectorAll(
        '.songChecklist:checked'
    );

    const list = Array.from(checkedSongs).map(item => item.value);
    const name = document.getElementById('playlistNameInput')

    addItem('playlists', {
        id: playlist.at(-1).id+1,
        name: name.value,
        list: list
    })
    
    document.getElementById('songSelectionOverlay').style.display = 'none'; 
    document.getElementById('songSelectionList').innerHTML = null
    name.value = null

    playlist = await getAllItem('playlists');
    
    renderPlaylistList()
}

async function overwritePlaylist(id) {
    const checkedSongs = document.querySelectorAll(
        '.songChecklist:checked'
    );

    const list = Array.from(checkedSongs).map(item => item.value);

    addItem('playlists', {
        id: id,
        name: playlist[id].name,
        list: list
    })
    
    document.getElementById('manageSongOverlay').style.display = 'none'; 
    document.getElementById('manageSongSelection').innerHTML = null

    playlist = await getAllItem('playlists');
    renderPlaylist(id)
}

const dragOverlay = document.getElementById("drop-overlay");
let dragCounter = 0;

document.addEventListener("dragenter", (event) => {
    event.preventDefault();

    dragCounter++;

    if (event.dataTransfer?.types.includes("Files")) {
    dragOverlay.classList.add("active");
    }
});

document.addEventListener("dragover", (event) => {
    event.preventDefault();

    event.dataTransfer.dropEffect = "copy";
});

document.addEventListener("dragleave", (event) => {
    event.preventDefault();

    dragCounter--;

    if (dragCounter <= 0) {
        dragCounter = 0;
        dragOverlay.classList.remove("active");
    }
});

document.addEventListener("drop", (event) => {
    event.preventDefault();

    dragCounter = 0;
    dragOverlay.classList.remove("active");

    const dt = new DataTransfer();

    for (const file of event.dataTransfer.files) {
        dt.items.add(file);
    }

    if (dt.items.length === 0) {
        return
    }

    document.getElementById('audioFile').files = dt.files;
    document.getElementById('audioFormOverlay').style.display = 'block'  
});

function playlistNameChange() {
    document.getElementById('playlistName').style.display = 'none'
    document.getElementById('playlistNameChange').style.display = 'block'
    document.getElementById('playlistNameChange').value = document.getElementById('playlistName').innerText
    document.getElementById('editName').style.display = 'none'
    document.getElementById('enterNewName').style.display = 'block'
}

function handleDeletePlaylist() {
    const modal = document.getElementById('popupModal')

    document.getElementById('modalOverlay').style.display = 'block'
     
    modal.innerHTML = `
        <p>Are you sure you want to delete this playlist?</p>
        <div>
            <button onclick="
                removePlaylist(${openedPlaylist})
                document.getElementById('modalOverlay').style.display='none'
            ">Yes</button>
            <button onclick="document.getElementById('modalOverlay').style.display='none'">No</button>
        </div>
    `
}

document.getElementById('playlistNameChange').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        renamePlaylist(openedPlaylist)
    }
})

function truncateString(str, maxLength=30) {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + '...';
  }
  return str;
}

const songPlaylistContainer = document.getElementById("songList");
let draggedItem = null;
let pointerId = null;
let dragPlaylistId = null;

function resetDrag() {
  if (draggedItem) draggedItem.classList.remove("dragging");
  songPlaylistContainer.classList.remove("isDragging");
  draggedItem = null;
  pointerId = null;
  dragPlaylistId = null;
}

function endDrag(e) {
  if (!draggedItem || e.pointerId !== pointerId) return;

  const id = dragPlaylistId;
  const items = [...songPlaylistContainer.querySelectorAll(".playlistItem")];
  resetDrag();

  const current = playlist.find((list) => list.id === id);
  if (!current || id !== openedPlaylist) return;

  const newPlaylist = items.map((item) => item.id.slice(0, -2));
  addItem("playlists", { id, name: current.name, list: newPlaylist });
  current.list = newPlaylist;
}

songPlaylistContainer.addEventListener("dragstart", (e) => e.preventDefault());

songPlaylistContainer.addEventListener("pointerdown", (e) => {
  const handle = e.target.closest(".songDragHandler");
  if (!handle) return;

  draggedItem = handle.closest(".playlistItem");
  if (!draggedItem) return;

  pointerId = e.pointerId;
  dragPlaylistId = openedPlaylist;
  songPlaylistContainer.setPointerCapture(pointerId);
  draggedItem.classList.add("dragging");
  songPlaylistContainer.classList.add("isDragging");
});

songPlaylistContainer.addEventListener("pointermove", (e) => {
  if (!draggedItem || e.pointerId !== pointerId) return;
  if (e.pointerType === "mouse" && e.buttons === 0) return endDrag(e);
  e.preventDefault();

  const items = [
    ...songPlaylistContainer.querySelectorAll(".playlistItem:not(.dragging)")
  ];
  if (!items.length) return;

  const y = e.clientY;
  const target = items.find((item) => {
    const r = item.getBoundingClientRect();
    return y >= r.top && y <= r.bottom;
  });

  if (target) {
    const isAbove =
      target.compareDocumentPosition(draggedItem) &
      Node.DOCUMENT_POSITION_FOLLOWING;
    songPlaylistContainer.insertBefore(
      draggedItem,
      isAbove ? target : target.nextSibling
    );
  } else if (y < items[0].getBoundingClientRect().top) {
    songPlaylistContainer.insertBefore(draggedItem, items[0]);
  } else if (y > items[items.length - 1].getBoundingClientRect().bottom) {
    songPlaylistContainer.appendChild(draggedItem);
  }
});

// window-level so the drag always ends, even outside the container
window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);
window.addEventListener("blur", resetDrag);
songPlaylistContainer.addEventListener("lostpointercapture", endDrag);

document.addEventListener("keydown", (event) => {
    const isPopupOpen = Array.from(document.querySelectorAll('.overlay'))
    .find(el => getComputedStyle(el).display !== 'none')

    if (event.key === "Escape" && isPopupOpen) {
        isPopupOpen.style.display = 'none'; 
        document.getElementById('songSelectionList').innerHTML = null     
        document.getElementById('manageSongSelection').innerHTML = null     
    }
});

const searchBars = document.querySelectorAll('.searchSongInput')

searchBars.forEach(input => {
    input.addEventListener("keyup", () => {
        const keyword = input.value.toLowerCase()
        let songExist = false

        document.querySelectorAll(".songSelectDiv").forEach(song => {
            const songName = song.dataset.name.toLowerCase()
            if (songName.includes(keyword)) {
                song.style.display = 'flex'
                songExist = true
            } else {
                song.style.display = 'none'
            }
        })

        if (!songExist) {
            document.getElementById('songNotFound').style.display = "block"
        } else {
            document.getElementById('songNotFound').style.display = "none"
        }
    })   
})

document.getElementById('audioFile').addEventListener('change', (e) => {
  const fileName = e.target.files[0]?.name || 'No file selected';
  document.getElementById('audioFileName').textContent = fileName;
});

setDefaultCover()
lucide.createIcons();   